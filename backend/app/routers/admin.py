from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/admin", tags=["Administrator Operations"])


@router.get("/users", response_model=List[schemas.UserOut])
def list_users(
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """List registered users with optional role and status filters."""
    query = db.query(models.User)
    if role:
        if role == "responder":
            query = query.filter(models.User.role.in_(["responder", "ngo"]))
        elif role == "government_official":
            query = query.filter(models.User.role.in_(["government_official", "official", "government"]))
        else:
            query = query.filter(models.User.role == role)
    if status:
        query = query.filter(models.User.status == status)
    return query.order_by(models.User.created_at.desc()).all()


@router.patch("/users/{id}/status", response_model=schemas.UserOut)
def update_user_status(
    id: int,
    status_update: schemas.UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Approve, reject, or suspend a user account (e.g. approve pending NGO/responder).
    Robustly synchronizes organization record in MySQL.
    """
    clean_status = status_update.status.lower().strip()
    if clean_status not in ["active", "rejected", "suspended", "pending_approval"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be one of: 'active', 'rejected', 'suspended', 'pending_approval'."
        )

    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Prevent admin from suspending themselves
    if user.id == current_user.id and clean_status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot suspend their own active account."
        )

    user.status = clean_status
    user.updated_at = func.now()

    # Synchronize organization status if linked or matchable by name/email
    org = None
    if user.organization_id:
        org = db.query(models.Organization).filter(models.Organization.id == user.organization_id).first()
    if not org and user.organization_name:
        org = db.query(models.Organization).filter(
            func.lower(models.Organization.name) == user.organization_name.lower()
        ).first()
        if org:
            user.organization_id = org.id
    if not org and user.email:
        org = db.query(models.Organization).filter(
            func.lower(models.Organization.contact_email) == user.email.lower()
        ).first()
        if org:
            user.organization_id = org.id
            user.organization_name = org.name

    if org and clean_status in ["active", "rejected", "suspended"]:
        org.status = clean_status
        org.updated_at = func.now()

    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{id}/reset-password", response_model=schemas.UserOut)
def admin_reset_user_password(
    id: int,
    reset_data: schemas.AdminPasswordReset,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Administrator-authenticated procedure to securely reset any user or NGO password.
    Re-hashes the password using secure bcrypt (12 rounds).
    Never exposes old or new hashes in logs or plaintext.
    """
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    new_hash = auth.hash_password(reset_data.new_password)
    user.password_hash = new_hash
    user.updated_at = func.now()

    # Also update password_hash on any corresponding GovernmentAccessRequest
    gov_req = db.query(models.GovernmentAccessRequest).filter(
        func.lower(models.GovernmentAccessRequest.email) == user.email.lower()
    ).first()
    if gov_req:
        gov_req.password_hash = new_hash
        gov_req.updated_at = func.now()

    db.commit()
    db.refresh(user)
    return user


@router.post("/users/provision", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def provision_user_account(
    user_in: schemas.PrivilegedUserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Administrator-only endpoint to provision Government Official or Administrator accounts.
    Enforces authorization, secure bcrypt hashing, and refuses to overwrite existing users.
    """
    clean_role = user_in.role.lower().strip()
    if clean_role not in ["government_official", "official", "government", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Privileged provisioning can only assign 'government_official' or 'admin' roles."
        )

    clean_email = user_in.email.lower().strip()
    existing = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{clean_email}' already exists. Refusing to overwrite existing user."
        )

    hashed_pw = auth.hash_password(user_in.password)
    assigned_role = "government_official" if clean_role in ["government_official", "official", "government"] else "admin"
    new_user = models.User(
        email=clean_email,
        password_hash=hashed_pw,
        full_name=user_in.full_name.strip(),
        phone=user_in.phone.strip() if user_in.phone else "1070",
        role=assigned_role,
        status="active",
        district=user_in.district.strip() if user_in.district else "AP Disaster Management Command",
        title_or_designation=user_in.title_or_designation.strip() if user_in.title_or_designation else "Disaster Operations Officer"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ==============================================================================
# Government Official Access Request Review & Provisioning
# ==============================================================================

@router.get("/government-requests", response_model=List[schemas.GovernmentAccessRequestOut])
def list_government_access_requests(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    List all government official access requests submitted through the portal.
    Authorized for State Administrators only.
    """
    query = db.query(models.GovernmentAccessRequest)
    if status:
        query = query.filter(models.GovernmentAccessRequest.status == status.lower().strip())
    return query.order_by(models.GovernmentAccessRequest.created_at.desc()).all()


@router.patch("/government-requests/{id}/decision", response_model=schemas.GovernmentAccessRequestOut)
def decide_government_access_request(
    id: int,
    decision: schemas.GovernmentAccessRequestDecision,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Manual Verification & Provisioning Workflow:
    State Administrator reviews claimed government authority, employee ID, and department.
    Approving provisions or activates an authentic User account with 'government_official' role.
    Rejecting records the administrative reason and blocks privileged command access.
    """
    clean_decision = decision.status.lower().strip()
    if clean_decision not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be either 'approved' or 'rejected'."
        )

    req = db.query(models.GovernmentAccessRequest).filter(models.GovernmentAccessRequest.id == id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Government official access request not found."
        )

    req.status = clean_decision
    req.admin_notes = decision.admin_notes.strip() if decision.admin_notes else None
    req.verified_by_id = current_user.id
    req.updated_at = func.now()

    if clean_decision == "approved":
        # Check if user already exists
        existing_user = db.query(models.User).filter(
            func.lower(models.User.email) == req.email.lower()
        ).first()

        if existing_user:
            # Upgrade or activate existing account
            existing_user.role = "government_official"
            existing_user.status = "active"
            existing_user.full_name = req.full_name
            existing_user.phone = req.phone or existing_user.phone or "1070"
            existing_user.district = req.district
            existing_user.title_or_designation = f"{req.designation} ({req.department})"
            existing_user.password_hash = req.password_hash
            existing_user.updated_at = func.now()
            req.user_id = existing_user.id
        else:
            # Provision brand new active official account with stored bcrypt hash
            new_user = models.User(
                email=req.email.lower(),
                password_hash=req.password_hash,
                full_name=req.full_name,
                phone=req.phone or "1070",
                role="government_official",
                status="active",
                district=req.district,
                title_or_designation=f"{req.designation} ({req.department})"
            )
            db.add(new_user)
            db.flush()
            req.user_id = new_user.id

    elif clean_decision == "rejected":
        # If user account was previously linked, deactivate it
        if req.user_id:
            linked_user = db.query(models.User).filter(models.User.id == req.user_id).first()
            if linked_user:
                linked_user.status = "rejected"
                linked_user.updated_at = func.now()

    db.commit()
    db.refresh(req)
    return req


# ==============================================================================
# Organization Management
# ==============================================================================

@router.get("/organizations", response_model=List[schemas.OrganizationOut])
def list_organizations(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """List registered relief and response organizations."""
    query = db.query(models.Organization)
    if status:
        query = query.filter(models.Organization.status == status)
    return query.order_by(models.Organization.created_at.desc()).all()


@router.post("/organizations", response_model=schemas.OrganizationOut, status_code=status.HTTP_201_CREATED)
def create_organization(
    org_in: schemas.OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Register a new official relief or responder organization."""
    existing = db.query(models.Organization).filter(
        func.lower(models.Organization.name) == org_in.name.strip().lower()
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization already registered.")

    org = models.Organization(
        name=org_in.name.strip(),
        org_type=org_in.org_type,
        district=org_in.district,
        contact_email=org_in.contact_email.lower() if org_in.contact_email else None,
        contact_phone=org_in.contact_phone,
        status="active",  # Admin-created orgs are active by default
        description=org_in.description
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.patch("/organizations/{id}/status", response_model=schemas.OrganizationOut)
def update_organization_status(
    id: int,
    status_update: schemas.OrganizationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Approve or reject a responder organization and synchronize all linked member responders.
    Ensures that when an organization application is approved, members can immediately log in.
    """
    clean_status = status_update.status.lower().strip()
    if clean_status not in ["active", "rejected", "pending_approval", "suspended"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid organization status.")

    org = db.query(models.Organization).filter(models.Organization.id == id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")

    org.status = clean_status
    org.updated_at = func.now()

    # Synchronize all member responders (by organization_id, matching name, or matching contact email)
    members_by_id = db.query(models.User).filter(models.User.organization_id == org.id).all()
    members_by_name = db.query(models.User).filter(
        func.lower(models.User.organization_name) == org.name.lower()
    ).all()
    members_by_email = []
    if org.contact_email:
        members_by_email = db.query(models.User).filter(
            func.lower(models.User.email) == org.contact_email.lower()
        ).all()

    all_members = {m.id: m for m in (members_by_id + members_by_name + members_by_email)}.values()

    for member in all_members:
        if member.role in ["responder", "ngo"]:
            member.status = clean_status
            member.organization_id = org.id
            member.organization_name = org.name
            member.updated_at = func.now()

    db.commit()
    db.refresh(org)
    return org


@router.get("/stats", response_model=schemas.DisasterStatsOut)
def get_real_database_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_responder)
):
    """
    Computes genuine real-time statistics from stored MySQL database records.
    Never returns fabricated or hardcoded numbers.
    """
    # Emergency requests breakdown
    all_requests = db.query(models.EmergencyRequest).all()
    total_requests = len(all_requests)

    submitted_count = sum(1 for r in all_requests if r.response_status == "Submitted")
    under_review_count = sum(1 for r in all_requests if r.response_status == "Under Review")
    verified_count = sum(1 for r in all_requests if r.response_status == "Verified")
    assigned_count = sum(1 for r in all_requests if r.response_status == "Assigned")
    in_progress_count = sum(1 for r in all_requests if r.response_status == "In Progress")
    resolved_count = sum(1 for r in all_requests if r.response_status == "Resolved")
    cancelled_count = sum(1 for r in all_requests if r.response_status == "Cancelled")
    rejected_count = sum(1 for r in all_requests if r.response_status == "Rejected")

    critical_count = sum(1 for r in all_requests if r.urgency == "Critical")
    high_count = sum(1 for r in all_requests if r.urgency == "High")
    medium_count = sum(1 for r in all_requests if r.urgency == "Medium")
    low_count = sum(1 for r in all_requests if r.urgency == "Low")

    # Shelters breakdown
    all_shelters = db.query(models.ShelterResource).all()
    total_shelters = len(all_shelters)
    active_shelters = sum(1 for s in all_shelters if s.status == "Active")
    total_capacity = sum(s.capacity for s in all_shelters)
    total_occupants = sum(s.current_occupants for s in all_shelters)

    # Pending responder approvals
    pending_responders = db.query(models.User).filter(
        models.User.role.in_(["responder", "ngo"]),
        models.User.status == "pending_approval"
    ).count()

    return schemas.DisasterStatsOut(
        total_requests=total_requests,
        submitted_count=submitted_count,
        under_review_count=under_review_count,
        verified_count=verified_count,
        assigned_count=assigned_count,
        in_progress_count=in_progress_count,
        resolved_count=resolved_count,
        cancelled_count=cancelled_count,
        rejected_count=rejected_count,
        critical_count=critical_count,
        high_count=high_count,
        medium_count=medium_count,
        low_count=low_count,
        total_shelters=total_shelters,
        active_shelters=active_shelters,
        total_capacity=total_capacity,
        total_occupants=total_occupants,
        pending_responders_count=pending_responders
    )
