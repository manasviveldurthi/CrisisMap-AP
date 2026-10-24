from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])


def _clean_phone_digits(phone: str) -> str:
    """Extract numeric digits from phone string for reliable matching."""
    return "".join(filter(str.isdigit, phone or ""))


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    """
    Public registration endpoint for Citizens and Responders/NGOs.
    Citizens are activated immediately.
    Responders/NGOs are created with 'pending_approval' status awaiting administrator verification.
    Attempting to register as 'admin' or 'government_official' is explicitly rejected.
    """
    # Reject administrative and government official self-registration
    clean_role = user_in.role.lower().strip()
    if clean_role in ["admin", "government_official", "official", "government"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration is disabled for government official and administrative roles. Accounts must be provisioned administratively."
        )
    if clean_role not in ["citizen", "responder", "ngo"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role specified. Only 'citizen' and 'responder' / 'ngo' registration are permitted."
        )

    # Standardize role name: 'ngo' maps to 'responder' role internally
    assigned_role = "citizen" if clean_role == "citizen" else "responder"

    clean_email = user_in.email.strip().lower()

    # Check email uniqueness across users table
    existing_user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Initial status
    initial_status = "active" if assigned_role == "citizen" else "pending_approval"

    # Automatically create and link Organization record for NGO / Responder applicants
    org_id = user_in.organization_id
    org_name = user_in.organization_name.strip() if user_in.organization_name else None
    if assigned_role == "responder" and org_name and not org_id:
        existing_org = db.query(models.Organization).filter(
            func.lower(models.Organization.name) == org_name.lower()
        ).first()
        if not existing_org:
            existing_org = models.Organization(
                name=org_name,
                org_type="NGO / Humanitarian Relief",
                district=user_in.district,
                contact_email=clean_email,
                contact_phone=user_in.phone.strip() if user_in.phone else None,
                status="pending_approval",
                description=f"Submitted by representative: {user_in.full_name.strip()} ({user_in.title_or_designation or 'Representative'})"
            )
            db.add(existing_org)
            db.flush()
        org_id = existing_org.id

    hashed_pw = auth.hash_password(user_in.password)
    user = models.User(
        email=clean_email,
        password_hash=hashed_pw,
        full_name=user_in.full_name.strip(),
        phone=user_in.phone.strip() if user_in.phone else None,
        role=assigned_role,
        status=initial_status,
        district=user_in.district,
        registered_address=user_in.registered_address,
        registered_latitude=user_in.registered_latitude,
        registered_longitude=user_in.registered_longitude,
        organization_name=org_name if assigned_role == "responder" else None,
        organization_id=org_id if assigned_role == "responder" else None,
        title_or_designation=user_in.title_or_designation
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Issue access token
    access_token = auth.create_access_token(data={"sub": str(user.id), "role": user.role})
    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserOut.model_validate(user)
    )


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Secure login endpoint verifying email and bcrypt hashed password.
    Synchronizes organization approval status for approved NGOs.
    Provides clear status messaging for pending government requests and pending NGO accounts.
    Issues a signed JWT access token upon successful credentials check.
    """
    clean_email = credentials.email.strip().lower()

    # 1. Look up user by email
    user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()

    # 2. If not found, check if an organization exists with this contact_email
    if not user:
        linked_org = db.query(models.Organization).filter(
            func.lower(models.Organization.contact_email) == clean_email
        ).first()
        if linked_org:
            # Find representative member for this organization
            user = db.query(models.User).filter(
                models.User.organization_id == linked_org.id
            ).first()

    # 3. If still not found, check if this is an unprovisioned or pending Government Access Request
    if not user:
        gov_req = db.query(models.GovernmentAccessRequest).filter(
            func.lower(models.GovernmentAccessRequest.email) == clean_email
        ).first()
        if gov_req:
            if gov_req.status == "pending":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your government official access request is currently pending administrative verification and account provisioning. An authorized administrator must review and approve your credentials before you can sign in."
                )
            elif gov_req.status == "rejected":
                note_suffix = f" Reason: {gov_req.admin_notes}" if gov_req.admin_notes else ""
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Your government official access request has been reviewed and rejected by an administrator.{note_suffix}"
                )

        # Standard invalid credentials rejection
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # 4. Verify password against bcrypt hash
    if not auth.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # 5. Synchronize NGO approval status between Organization and User
    if user.role in ["responder", "ngo"]:
        # Find associated organization
        org = None
        if user.organization_id:
            org = db.query(models.Organization).filter(models.Organization.id == user.organization_id).first()
        elif user.organization_name:
            org = db.query(models.Organization).filter(
                func.lower(models.Organization.name) == user.organization_name.lower()
            ).first()
            if org:
                user.organization_id = org.id
        elif user.email:
            org = db.query(models.Organization).filter(
                func.lower(models.Organization.contact_email) == user.email.lower()
            ).first()
            if org:
                user.organization_id = org.id
                user.organization_name = org.name

        # If organization was approved by admin, synchronize user account to active
        if org:
            if org.status == "active" and user.status == "pending_approval":
                user.status = "active"
                user.updated_at = func.now()
                db.commit()
                db.refresh(user)
            elif user.status == "active" and org.status == "pending_approval":
                org.status = "active"
                org.updated_at = func.now()
                db.commit()
            elif org.status == "rejected" and user.status != "rejected":
                user.status = "rejected"
                user.updated_at = func.now()
                db.commit()
                db.refresh(user)

    # 6. Check user account status
    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended by an administrator."
        )

    if user.status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your registration application has been rejected by an administrator."
        )

    if user.status == "pending_approval":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your organization / responder account is currently pending administrator review and approval. You will be able to log in once state administration approves your application."
        )

    access_token = auth.create_access_token(data={"sub": str(user.id), "role": user.role})
    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserOut.model_validate(user)
    )


# ==============================================================================
# Government Official Access Request & Status
# ==============================================================================

@router.post(
    "/government/request-access",
    response_model=schemas.GovernmentAccessRequestOut,
    status_code=status.HTTP_201_CREATED
)
def submit_government_access_request(
    request_in: schemas.GovernmentAccessRequestCreate,
    db: Session = Depends(get_db)
):
    """
    Submits a government official access request for administrator review.
    Does NOT directly create a privileged user account.
    Stores verification details and a secure bcrypt password hash.
    Accounts are only provisioned and activated after manual administrator verification.
    """
    clean_email = request_in.email.strip().lower()

    # Check if account already exists in users table
    existing_user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in or contact administration."
        )

    # Check existing access requests
    existing_req = db.query(models.GovernmentAccessRequest).filter(
        func.lower(models.GovernmentAccessRequest.email) == clean_email
    ).first()

    hashed_pw = auth.hash_password(request_in.password)

    if existing_req:
        if existing_req.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An access request with this official email is already pending administrator verification."
            )
        # If previously rejected, allow resubmission
        existing_req.full_name = request_in.full_name.strip()
        existing_req.phone = request_in.phone.strip() if request_in.phone else None
        existing_req.department = request_in.department.strip()
        existing_req.designation = request_in.designation.strip()
        existing_req.district = request_in.district.strip()
        existing_req.employee_id = request_in.employee_id.strip()
        existing_req.verification_details = request_in.verification_details.strip() if request_in.verification_details else None
        existing_req.password_hash = hashed_pw
        existing_req.status = "pending"
        existing_req.admin_notes = None
        existing_req.updated_at = func.now()
        db.commit()
        db.refresh(existing_req)
        return existing_req

    new_req = models.GovernmentAccessRequest(
        full_name=request_in.full_name.strip(),
        email=clean_email,
        phone=request_in.phone.strip() if request_in.phone else None,
        department=request_in.department.strip(),
        designation=request_in.designation.strip(),
        district=request_in.district.strip(),
        employee_id=request_in.employee_id.strip(),
        verification_details=request_in.verification_details.strip() if request_in.verification_details else None,
        password_hash=hashed_pw,
        status="pending"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req


@router.get("/government/request-status")
def check_government_request_status(
    email: str = Query(..., description="Official email address to check status for"),
    db: Session = Depends(get_db)
):
    """
    Public lookup for applicants to track the progress of their government access request.
    Displays clearly whether the request is 'pending', 'approved', or 'rejected'.
    Never exposes passwords, hashes, or tokens.
    """
    clean_email = email.strip().lower()

    # 1. Check if user has already been provisioned and is active
    user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
    if user and user.role in ["government_official", "official", "admin"] and user.status == "active":
        return {
            "email": clean_email,
            "status": "approved",
            "full_name": user.full_name,
            "role": user.role,
            "department": user.district,
            "designation": user.title_or_designation,
            "message": "Your government official account has been provisioned and is ACTIVE. You can now sign in using the Government Official login form."
        }

    # 2. Check government access request records
    req = db.query(models.GovernmentAccessRequest).filter(
        func.lower(models.GovernmentAccessRequest.email) == clean_email
    ).first()

    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No government access request found for this email address. Please submit an access request."
        )

    if req.status == "pending":
        msg = "Your access request is currently PENDING manual administrative verification by AP Disaster Management State Administration."
    elif req.status == "approved":
        msg = "Your access request has been APPROVED and provisioned. You can now sign in with your official password."
    else:
        msg = f"Your access request was REJECTED by an administrator.{' Notes: ' + req.admin_notes if req.admin_notes else ''}"

    return {
        "email": req.email,
        "status": req.status,
        "full_name": req.full_name,
        "department": req.department,
        "designation": req.designation,
        "district": req.district,
        "employee_id": req.employee_id,
        "submitted_at": req.created_at,
        "admin_notes": req.admin_notes,
        "message": msg
    }


# ==============================================================================
# Secure Password Reset
# ==============================================================================

@router.post("/reset-password")
def reset_password_with_verification(
    reset_data: schemas.PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Secure self-service password reset procedure.
    Verifies that the provided phone number matches the registered user's record.
    Securely re-hashes the new password with bcrypt (12 rounds).
    Does NOT bypass authentication or leak secrets.
    """
    clean_email = reset_data.email.strip().lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered user account found with this email address."
        )

    # Verify identity against registered phone number digits
    user_digits = _clean_phone_digits(user.phone)
    input_digits = _clean_phone_digits(reset_data.phone)

    if not user_digits or not input_digits or user_digits != input_digits:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identity verification failed: The registered phone number does not match this account."
        )

    new_hash = auth.hash_password(reset_data.new_password)
    user.password_hash = new_hash
    user.updated_at = func.now()

    # Also update password_hash on any government access request
    gov_req = db.query(models.GovernmentAccessRequest).filter(
        func.lower(models.GovernmentAccessRequest.email) == clean_email
    ).first()
    if gov_req:
        gov_req.password_hash = new_hash
        gov_req.updated_at = func.now()

    db.commit()

    return {
        "success": True,
        "message": f"Password for {user.email} has been reset securely. You may now sign in with your new credentials."
    }


# ==============================================================================
# Profile Management
# ==============================================================================

@router.get("/me", response_model=schemas.UserOut)
def get_current_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    """Returns the authenticated user's current profile."""
    return current_user


@router.put("/profile", response_model=schemas.UserOut)
def update_profile(
    profile_data: schemas.UserUpdateProfile,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile information including registered usual/last-known location."""
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name.strip()
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone.strip()
    if profile_data.district is not None:
        current_user.district = profile_data.district
    if profile_data.registered_address is not None:
        current_user.registered_address = profile_data.registered_address
    if profile_data.registered_latitude is not None:
        current_user.registered_latitude = profile_data.registered_latitude
    if profile_data.registered_longitude is not None:
        current_user.registered_longitude = profile_data.registered_longitude
    if profile_data.title_or_designation is not None:
        current_user.title_or_designation = profile_data.title_or_designation

    db.commit()
    db.refresh(current_user)
    return current_user
