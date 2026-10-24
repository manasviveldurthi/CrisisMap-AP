from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field


# ==============================================================================
# Authentication & User Schemas
# ==============================================================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, description="Password at least 6 characters")
    full_name: str = Field(min_length=2, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=50)
    role: str = Field(default="citizen", description="Role: 'citizen' or 'responder'. Public registration cannot select admin.")
    
    # Citizen location profile
    district: Optional[str] = None
    registered_address: Optional[str] = None
    registered_latitude: Optional[float] = None
    registered_longitude: Optional[float] = None
    
    # Responder specific
    organization_name: Optional[str] = None
    organization_id: Optional[int] = None
    title_or_designation: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    status: str
    district: Optional[str] = None
    registered_address: Optional[str] = None
    registered_latitude: Optional[float] = None
    registered_longitude: Optional[float] = None
    organization_name: Optional[str] = None
    organization_id: Optional[int] = None
    title_or_designation: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserUpdateProfile(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    district: Optional[str] = None
    registered_address: Optional[str] = None
    registered_latitude: Optional[float] = None
    registered_longitude: Optional[float] = None
    title_or_designation: Optional[str] = None


class UserStatusUpdate(BaseModel):
    status: str = Field(description="'active', 'rejected', or 'suspended'")
    note: Optional[str] = Field(default=None, description="Optional administrative decision note")


class PrivilegedUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, description="Password at least 6 characters")
    full_name: str = Field(min_length=2, max_length=150)
    phone: Optional[str] = Field(default="1070", max_length=50)
    role: str = Field(description="'government_official' or 'admin'")
    district: Optional[str] = Field(default="AP Disaster Management Command", max_length=100)
    title_or_designation: Optional[str] = Field(default="Emergency Operations Officer", max_length=150)


class GovernmentAccessRequestCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=50)
    department: str = Field(min_length=2, max_length=150, description="Government department or agency")
    designation: str = Field(min_length=2, max_length=150, description="Official post or designation")
    district: str = Field(min_length=2, max_length=100, description="District of jurisdiction")
    employee_id: str = Field(min_length=2, max_length=100, description="Official government employee or badge code")
    verification_details: Optional[str] = Field(default=None, description="Supporting manual verification details")
    password: str = Field(min_length=6, description="Password at least 6 characters")


class GovernmentAccessRequestOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    department: str
    designation: str
    district: str
    employee_id: str
    verification_details: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GovernmentAccessRequestDecision(BaseModel):
    status: str = Field(description="'approved' or 'rejected'")
    admin_notes: Optional[str] = Field(default=None, description="Administrative decision reasoning and verification notes")


class PasswordResetRequest(BaseModel):
    email: EmailStr
    phone: str = Field(min_length=4, description="Registered phone number for identity confirmation")
    new_password: str = Field(min_length=6, description="New password at least 6 characters")


class AdminPasswordReset(BaseModel):
    new_password: str = Field(min_length=6, description="New password at least 6 characters")


# ==============================================================================
# Organization Schemas
# ==============================================================================

class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    org_type: str = Field(default="Government (SDRF/NDRF)", max_length=80)
    district: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    description: Optional[str] = None


class OrganizationOut(BaseModel):
    id: int
    name: str
    org_type: str
    district: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrganizationStatusUpdate(BaseModel):
    status: str = Field(description="'active', 'rejected', or 'pending_approval'")
    note: Optional[str] = Field(default=None, description="Optional administrative decision note")


# ==============================================================================
# Request Timeline & Updates Schemas
# ==============================================================================

class RequestUpdateOut(BaseModel):
    id: int
    request_id: int
    user_id: Optional[int] = None
    author_name: str
    author_role: str
    previous_status: Optional[str] = None
    new_status: str
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RequestNoteCreate(BaseModel):
    note: str = Field(min_length=1, max_length=2000)


# ==============================================================================
# Emergency Request Schemas
# ==============================================================================

class EmergencyRequestCreate(BaseModel):
    contact_name: str = Field(min_length=2, max_length=150)
    phone: str = Field(min_length=5, max_length=50)
    category: str = Field(default="Flood", max_length=50)
    urgency: Optional[str] = Field(default="High")
    description: str = Field(min_length=5, max_length=5000)
    people_affected: int = Field(default=1, ge=1)
    assistance_needs: Optional[List[str]] = Field(default_factory=list)
    vulnerable_groups: Optional[List[str]] = Field(default_factory=list)
    district: str = Field(min_length=2, max_length=100)
    locality: Optional[str] = ""
    address: Optional[str] = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_type: Optional[str] = "current_confirmed" # current_confirmed, last_known_registered, manual_entry
    photo_url: Optional[str] = None


class EmergencyRequestOut(BaseModel):
    id: int
    reference_code: str
    reporter_id: Optional[int] = None
    contact_name: str
    phone: str
    category: str
    urgency: str
    ai_urgency_suggestion: Optional[str] = None
    ai_suggestion_reason: Optional[str] = None
    description: str
    people_affected: int
    assistance_needs: Optional[List[str]] = None
    vulnerable_groups: Optional[List[str]] = None
    district: str
    locality: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_type: str
    photo_url: Optional[str] = None
    verification_status: str
    response_status: str
    assigned_responder_id: Optional[int] = None
    assigned_organization_id: Optional[int] = None
    assigned_responder_name: Optional[str] = None
    potential_duplicate_of_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    timeline_updates: List[RequestUpdateOut] = []

    class Config:
        from_attributes = True


class EmergencyRequestStatusUpdate(BaseModel):
    new_status: str = Field(description="Submitted, Under Review, Verified, Assigned, In Progress, Resolved, Rejected, Cancelled")
    note: Optional[str] = None


class EmergencyRequestAssign(BaseModel):
    responder_id: Optional[int] = None
    responder_name: Optional[str] = None
    organization_id: Optional[int] = None
    note: Optional[str] = None


class EmergencyRequestVerificationUpdate(BaseModel):
    verification_status: str = Field(description="Verified, Flagged_Suspicious, Duplicate, Unverified")
    urgency: Optional[str] = None
    note: Optional[str] = None


# ==============================================================================
# Shelter Schemas
# ==============================================================================

class ShelterCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    district: str = Field(min_length=2, max_length=100)
    locality: Optional[str] = ""
    address: Optional[str] = ""
    latitude: float
    longitude: float
    capacity: int = Field(default=500, ge=1)
    current_occupants: int = Field(default=0, ge=0)
    status: str = Field(default="Active", max_length=50)
    facilities: Optional[List[str]] = Field(default_factory=list)
    helpline_phone: Optional[str] = None
    coordinator_name: Optional[str] = None


class ShelterUpdate(BaseModel):
    capacity: Optional[int] = None
    current_occupants: Optional[int] = None
    status: Optional[str] = None
    facilities: Optional[List[str]] = None
    helpline_phone: Optional[str] = None
    coordinator_name: Optional[str] = None


class ShelterOut(BaseModel):
    id: int
    name: str
    district: str
    locality: Optional[str] = None
    address: Optional[str] = None
    latitude: float
    longitude: float
    capacity: int
    current_occupants: int
    status: str
    facilities: Optional[List[str]] = None
    helpline_phone: Optional[str] = None
    coordinator_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==============================================================================
# Statistics & Overview
# ==============================================================================

class DisasterStatsOut(BaseModel):
    total_requests: int
    submitted_count: int
    under_review_count: int
    verified_count: int
    assigned_count: int
    in_progress_count: int
    resolved_count: int
    cancelled_count: int
    rejected_count: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    total_shelters: int
    active_shelters: int
    total_capacity: int
    total_occupants: int
    pending_responders_count: int
