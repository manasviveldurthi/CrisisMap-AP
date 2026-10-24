import datetime
from typing import Optional, List, Any
from sqlalchemy import (
    Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(30), default="citizen", nullable=False, index=True)  # citizen, responder, admin
    status = Column(String(30), default="active", nullable=False, index=True) # active, pending_approval, rejected, suspended
    
    # Citizen profile details
    district = Column(String(100), nullable=True)
    registered_address = Column(Text, nullable=True)
    registered_latitude = Column(Float, nullable=True)
    registered_longitude = Column(Float, nullable=True)
    
    # Responder / Org association
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    organization_name = Column(String(150), nullable=True)
    title_or_designation = Column(String(150), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="members", foreign_keys=[organization_id])
    emergency_requests = relationship("EmergencyRequest", back_populates="reporter", foreign_keys="EmergencyRequest.reporter_id")
    assigned_requests = relationship("EmergencyRequest", back_populates="assigned_responder", foreign_keys="EmergencyRequest.assigned_responder_id")
    assignments = relationship("ResponderAssignment", back_populates="responder", foreign_keys="ResponderAssignment.responder_id")
    updates_authored = relationship("RequestUpdate", back_populates="user")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), unique=True, nullable=False, index=True)
    org_type = Column(String(80), nullable=False)  # Government, NGO, SDRF/NDRF, Civil Defense, Medical
    district = Column(String(100), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    status = Column(String(30), default="pending_approval", nullable=False, index=True) # active, pending_approval, rejected
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    members = relationship("User", back_populates="organization")
    assigned_requests = relationship("EmergencyRequest", back_populates="assigned_organization")


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    reference_code = Column(String(50), unique=True, index=True, nullable=False)
    
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    contact_name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    
    category = Column(String(50), nullable=False, index=True) # Flood, Cyclone, Earthquake, Fire, Landslide, etc.
    urgency = Column(String(30), default="High", nullable=False, index=True) # Critical, High, Medium, Low
    ai_urgency_suggestion = Column(String(30), nullable=True) # Rule/AI suggestion
    ai_suggestion_reason = Column(Text, nullable=True)
    
    description = Column(Text, nullable=False)
    people_affected = Column(Integer, default=1, nullable=False)
    assistance_needs = Column(JSON, nullable=True) # ["Rescue Boat", "Drinking Water", "Medical"]
    vulnerable_groups = Column(JSON, nullable=True) # ["Infants", "Elderly", "Pregnant"]
    
    district = Column(String(100), nullable=False, index=True)
    locality = Column(String(200), nullable=True)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_type = Column(String(50), default="current_confirmed", nullable=False) # current_confirmed, last_known_registered, manual_entry
    photo_url = Column(Text, nullable=True)
    
    verification_status = Column(String(30), default="Unverified", nullable=False, index=True) # Unverified, Verified, Flagged_Suspicious, Duplicate
    response_status = Column(String(50), default="Submitted", nullable=False, index=True) # Submitted, Under Review, Verified, Assigned, In Progress, Resolved, Rejected, Cancelled
    
    assigned_responder_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    assigned_responder_name = Column(String(150), nullable=True)
    
    potential_duplicate_of_id = Column(Integer, ForeignKey("emergency_requests.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    reporter = relationship("User", back_populates="emergency_requests", foreign_keys=[reporter_id])
    assigned_responder = relationship("User", back_populates="assigned_requests", foreign_keys=[assigned_responder_id])
    assigned_organization = relationship("Organization", back_populates="assigned_requests", foreign_keys=[assigned_organization_id])
    assignments = relationship("ResponderAssignment", back_populates="request", cascade="all, delete-orphan")
    timeline_updates = relationship("RequestUpdate", back_populates="request", cascade="all, delete-orphan", order_by="RequestUpdate.created_at.asc()")


class ResponderAssignment(Base):
    __tablename__ = "responder_assignments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("emergency_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    responder_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String(30), default="Assigned", nullable=False) # Assigned, Accepted, Declined, Completed
    notes = Column(Text, nullable=True)
    
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    request = relationship("EmergencyRequest", back_populates="assignments")
    responder = relationship("User", back_populates="assignments", foreign_keys=[responder_id])


class RequestUpdate(Base):
    __tablename__ = "request_updates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("emergency_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    author_name = Column(String(150), nullable=False)
    author_role = Column(String(50), nullable=False)
    
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    note = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    request = relationship("EmergencyRequest", back_populates="timeline_updates")
    user = relationship("User", back_populates="updates_authored")


class ShelterResource(Base):
    __tablename__ = "shelters_resources"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    locality = Column(String(200), nullable=True)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    capacity = Column(Integer, default=500, nullable=False)
    current_occupants = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="Active", nullable=False) # Active, Full, Temporarily Inactive, Closed
    facilities = Column(JSON, nullable=True)
    
    helpline_phone = Column(String(50), nullable=True)
    coordinator_name = Column(String(150), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class GovernmentAccessRequest(Base):
    __tablename__ = "government_access_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    department = Column(String(150), nullable=False)  # e.g. Disaster Management, Revenue, Police, Fire Services, Health
    designation = Column(String(150), nullable=False) # e.g. District Collector, Disaster Operations Officer, Tahsildar
    district = Column(String(100), nullable=False, index=True)
    employee_id = Column(String(100), nullable=False) # Official government ID / Employment code
    verification_details = Column(Text, nullable=True) # Manual verification notes, nodal officer contact, ID card reference
    password_hash = Column(String(255), nullable=False) # Bcrypt hashed password to provision account with upon approval
    status = Column(String(30), default="pending", nullable=False, index=True) # pending, approved, rejected
    admin_notes = Column(Text, nullable=True) # Administrative decision notes
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Provisioned User account ID
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Admin who verified

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])
