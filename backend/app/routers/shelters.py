from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/shelters", tags=["Relief Shelters & Resources"])


@router.get("", response_model=List[schemas.ShelterOut])
def list_shelters(
    district: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    List verified disaster relief shelters and resource centers.
    Returns real records from the MySQL database.
    """
    query = db.query(models.ShelterResource)
    if district:
        query = query.filter(models.ShelterResource.district == district)
    if status:
        query = query.filter(models.ShelterResource.status == status)
    return query.order_by(models.ShelterResource.name.asc()).all()


@router.post("", response_model=schemas.ShelterOut, status_code=status.HTTP_201_CREATED)
def create_shelter(
    shelter_in: schemas.ShelterCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_responder)
):
    """
    Register a genuine relief shelter.
    Authorized for Responders and Administrators only.
    """
    shelter = models.ShelterResource(
        name=shelter_in.name.strip(),
        district=shelter_in.district,
        locality=shelter_in.locality,
        address=shelter_in.address,
        latitude=shelter_in.latitude,
        longitude=shelter_in.longitude,
        capacity=shelter_in.capacity,
        current_occupants=shelter_in.current_occupants,
        status=shelter_in.status,
        facilities=shelter_in.facilities or [],
        helpline_phone=shelter_in.helpline_phone,
        coordinator_name=shelter_in.coordinator_name or current_user.full_name,
        created_by_id=current_user.id
    )
    db.add(shelter)
    db.commit()
    db.refresh(shelter)
    return shelter


@router.patch("/{id}", response_model=schemas.ShelterOut)
def update_shelter(
    id: int,
    shelter_update: schemas.ShelterUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_responder)
):
    """Update occupancy, capacity, or operational status of a shelter."""
    shelter = db.query(models.ShelterResource).filter(models.ShelterResource.id == id).first()
    if not shelter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelter not found.")

    if shelter_update.capacity is not None:
        shelter.capacity = shelter_update.capacity
    if shelter_update.current_occupants is not None:
        shelter.current_occupants = shelter_update.current_occupants
    if shelter_update.status is not None:
        shelter.status = shelter_update.status
    if shelter_update.facilities is not None:
        shelter.facilities = shelter_update.facilities
    if shelter_update.helpline_phone is not None:
        shelter.helpline_phone = shelter_update.helpline_phone
    if shelter_update.coordinator_name is not None:
        shelter.coordinator_name = shelter_update.coordinator_name

    db.commit()
    db.refresh(shelter)
    return shelter


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shelter(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Remove a decommissioned shelter record. Admin only."""
    shelter = db.query(models.ShelterResource).filter(models.ShelterResource.id == id).first()
    if not shelter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelter not found.")

    db.delete(shelter)
    db.commit()
    return None
