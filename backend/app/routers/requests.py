import random
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth, services

router = APIRouter(prefix="/requests", tags=["Emergency Assistance Requests"])

# Permitted response status values
VALID_RESPONSE_STATUSES = {
    "Submitted",
    "Under Review",
    "Acknowledged",
    "Verified",
    "Assigned",
    "Assigned to Responder",
    "In Progress",
    "Assistance Dispatched",
    "Assistance Delivered / In Progress",
    "Resolved",
    "Rejected",
    "Cancelled"
}

VALID_VERIFICATION_STATUSES = {
    "Unverified",
    "Verified",
    "Flagged_Suspicious",
    "Duplicate"
}


def generate_reference_code(db: Session) -> str:
    """Generate a unique human-friendly tracking code: SOS-AP-2026-XXXX."""
    for _ in range(10):
        code = f"SOS-AP-2026-{random.randint(1000, 9999)}"
        existing = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.reference_code == code).first()
        if not existing:
            return code
    return f"SOS-AP-2026-{int(time.time()) % 100000}"


@router.post("", response_model=schemas.EmergencyRequestOut, status_code=status.HTTP_201_CREATED)
def submit_emergency_request(
    request_in: schemas.EmergencyRequestCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_current_user)
):
    """
    Submits an emergency assistance report.
    - Saves real record to MySQL database.
    - Calculates rule/AI urgency recommendation clearly distinguished from human decision.
    - Runs non-destructive duplicate detection.
    - Records initial 'Submitted' lifecycle audit log.
    """
    # Evaluate heuristic urgency suggestion
    ai_urgency, ai_reason = services.evaluate_urgency_suggestion(
        category=request_in.category,
        people_affected=request_in.people_affected,
        assistance_needs=request_in.assistance_needs or [],
        vulnerable_groups=request_in.vulnerable_groups or [],
        description=request_in.description
    )

    # Human initial urgency defaults to user's selection or AI suggestion
    initial_urgency = request_in.urgency if request_in.urgency in ["Critical", "High", "Medium", "Low"] else ai_urgency

    # Check for potential duplicates non-destructively
    dup_id = services.check_for_duplicates(
        db=db,
        district=request_in.district,
        latitude=request_in.latitude,
        longitude=request_in.longitude,
        phone=request_in.phone
    )

    ref_code = generate_reference_code(db)

    # Determine reporter if available
    reporter_id = None
    if current_user:
        reporter_id = current_user.id

    new_request = models.EmergencyRequest(
        reference_code=ref_code,
        reporter_id=reporter_id,
        contact_name=request_in.contact_name.strip(),
        phone=request_in.phone.strip(),
        category=request_in.category,
        urgency=initial_urgency,
        ai_urgency_suggestion=ai_urgency,
        ai_suggestion_reason=ai_reason,
        description=request_in.description.strip(),
        people_affected=request_in.people_affected,
        assistance_needs=request_in.assistance_needs,
        vulnerable_groups=request_in.vulnerable_groups,
        district=request_in.district,
        locality=request_in.locality,
        address=request_in.address,
        latitude=request_in.latitude,
        longitude=request_in.longitude,
        location_type=request_in.location_type or "current_confirmed",
        photo_url=request_in.photo_url,
        verification_status="Unverified",
        response_status="Submitted",
        potential_duplicate_of_id=dup_id
    )

    db.add(new_request)
    db.flush() # Populate ID

    # Create initial timeline entry
    initial_log = models.RequestUpdate(
        request_id=new_request.id,
        user_id=reporter_id,
        author_name=request_in.contact_name,
        author_role="Citizen Reporter",
        previous_status=None,
        new_status="Submitted",
        note="Emergency report submitted and saved to operational database."
    )
    db.add(initial_log)

    db.commit()
    db.refresh(new_request)
    return new_request


@router.get("", response_model=List[schemas.EmergencyRequestOut])
def list_emergency_requests(
    district: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    response_status: Optional[str] = Query(None),
    verification_status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_responder)
):
    """
    List emergency requests with filters.
    Authorized for Responders and Administrators.
    """
    query = db.query(models.EmergencyRequest)

    if district:
        query = query.filter(models.EmergencyRequest.district == district)
    if category:
        query = query.filter(models.EmergencyRequest.category == category)
    if urgency:
        query = query.filter(models.EmergencyRequest.urgency == urgency)
    if response_status:
        query = query.filter(models.EmergencyRequest.response_status == response_status)
    if verification_status:
        query = query.filter(models.EmergencyRequest.verification_status == verification_status)

    return query.order_by(models.EmergencyRequest.created_at.desc()).all()


@router.get("/my", response_model=List[schemas.EmergencyRequestOut])
def list_my_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Returns emergency requests submitted by the currently logged-in citizen.
    Also matches reports where phone number or reporter_id matches.
    """
    query = db.query(models.EmergencyRequest).filter(
        (models.EmergencyRequest.reporter_id == current_user.id) |
        (models.EmergencyRequest.phone == current_user.phone)
    )
    return query.order_by(models.EmergencyRequest.created_at.desc()).all()


@router.get("/{identifier}", response_model=schemas.EmergencyRequestOut)
def get_emergency_request(
    identifier: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Retrieve single request by integer ID or reference code (e.g., 'SOS-AP-2026-1234').
    Enforces authorization:
    - Citizens can only view their own private requests.
    - Active responders, government officials, and administrators can view for coordination.
    """
    if identifier.isdigit():
        req = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == int(identifier)).first()
    else:
        req = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.reference_code == identifier.strip()).first()

    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request '{identifier}' was not found in the database."
        )

    # Citizen data privacy isolation: citizens can strictly only access their own requests
    if current_user.role == "citizen":
        is_owner = (
            (req.reporter_id is not None and req.reporter_id == current_user.id) or
            (current_user.phone and req.phone == current_user.phone)
        )
        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not authorized to view another citizen's private emergency request."
            )

    return req


@router.patch("/{id}/status", response_model=schemas.EmergencyRequestOut)
def update_request_status(
    id: int,
    status_update: schemas.EmergencyRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_responder)
):
    """
    Updates the response lifecycle status of an emergency request.
    Records the transition, responsible responder/admin, and note to the audit log.
    """
    if status_update.new_status not in VALID_RESPONSE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Permitted values: {', '.join(sorted(VALID_RESPONSE_STATUSES))}"
        )

    req = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    prev_status = req.response_status
    req.response_status = status_update.new_status

    # Record audit log
    note_msg = status_update.note.strip() if status_update.note else f"Status transitioned from '{prev_status}' to '{status_update.new_status}'."
    audit_entry = models.RequestUpdate(
        request_id=req.id,
        user_id=current_user.id,
        author_name=current_user.full_name,
        author_role=f"{current_user.role.capitalize()} ({current_user.organization_name or 'AP Operations'})",
        previous_status=prev_status,
        new_status=status_update.new_status,
        note=note_msg
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{id}/assign", response_model=schemas.EmergencyRequestOut)
def assign_request(
    id: int,
    assign_in: schemas.EmergencyRequestAssign,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_responder)
):
    """
    Assigns an emergency request to an authorized responder or organization.
    Records assignment in responder_assignments table and creates a timeline log.
    """
    req = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    assigned_name = assign_in.responder_name or current_user.full_name
    assigned_user_id = assign_in.responder_id or current_user.id

    req.assigned_responder_id = assigned_user_id
    req.assigned_responder_name = assigned_name
    req.assigned_organization_id = assign_in.organization_id or current_user.organization_id
    
    prev_status = req.response_status
    req.response_status = "Assigned"

    # Create responder assignment record
    assignment_record = models.ResponderAssignment(
        request_id=req.id,
        responder_id=assigned_user_id,
        assigned_by_id=current_user.id,
        status="Assigned",
        notes=assign_in.note
    )
    db.add(assignment_record)

    # Create timeline entry
    note_text = assign_in.note or f"Assigned to {assigned_name}."
    timeline_entry = models.RequestUpdate(
        request_id=req.id,
        user_id=current_user.id,
        author_name=current_user.full_name,
        author_role=f"{current_user.role.capitalize()} ({current_user.organization_name or 'Operations'})",
        previous_status=prev_status,
        new_status="Assigned",
        note=note_text
    )
    db.add(timeline_entry)

    db.commit()
    db.refresh(req)
    return req


@router.patch("/{id}/verify", response_model=schemas.EmergencyRequestOut)
def verify_request(
    id: int,
    verify_in: schemas.EmergencyRequestVerificationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_government)
):
    """
    Government official and administrator endpoint to verify an emergency report and prioritize rescue needs.
    """
    if verify_in.verification_status not in VALID_VERIFICATION_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification status. Permitted values: {', '.join(sorted(VALID_VERIFICATION_STATUSES))}"
        )

    req = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    req.verification_status = verify_in.verification_status
    if verify_in.urgency and verify_in.urgency in ["Critical", "High", "Medium", "Low"]:
        req.urgency = verify_in.urgency

    author_title = "Administrator" if current_user.role == "admin" else "Government Official"
    note_text = verify_in.note or f"Verification status updated to '{verify_in.verification_status}'."
    timeline_entry = models.RequestUpdate(
        request_id=req.id,
        user_id=current_user.id,
        author_name=current_user.full_name,
        author_role=author_title,
        previous_status=req.response_status,
        new_status=req.response_status,
        note=note_text
    )
    db.add(timeline_entry)

    db.commit()
    db.refresh(req)
    return req


@router.post("/{id}/notes", response_model=schemas.RequestUpdateOut)
def add_coordination_note(
    id: int,
    note_in: schemas.RequestNoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_responder)
):
    """Adds an operational coordination note to an emergency request timeline."""
    req = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    new_note = models.RequestUpdate(
        request_id=req.id,
        user_id=current_user.id,
        author_name=current_user.full_name,
        author_role=f"{current_user.role.capitalize()} ({current_user.organization_name or 'Operations'})",
        previous_status=req.response_status,
        new_status=req.response_status,
        note=note_in.note.strip()
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


@router.post("/{id}/cancel", response_model=schemas.EmergencyRequestOut)
def cancel_request(
    id: int,
    reason: Optional[str] = Query(default="Situation resolved independently or cancelled by citizen."),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Allows a citizen to cancel their own request, or an administrator to cancel."""
    req = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    # Check authorization: citizens can only cancel their own; admins/government officials can cancel
    if current_user.role not in ["admin", "government_official", "official"] and req.reporter_id != current_user.id and req.phone != current_user.phone:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to cancel this emergency request."
        )

    prev_status = req.response_status
    req.response_status = "Cancelled"

    cancel_log = models.RequestUpdate(
        request_id=req.id,
        user_id=current_user.id,
        author_name=current_user.full_name,
        author_role=f"{current_user.role.capitalize()}",
        previous_status=prev_status,
        new_status="Cancelled",
        note=reason
    )
    db.add(cancel_log)
    db.commit()
    db.refresh(req)
    return req
