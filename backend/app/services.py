import math
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from app import models


def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine formula to compute great-circle distance between two points in km."""
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def evaluate_urgency_suggestion(
    category: str,
    people_affected: int,
    assistance_needs: list,
    vulnerable_groups: list,
    description: str
) -> Tuple[str, str]:
    """
    Evaluates incident parameters to generate an automated triage recommendation.
    NOTE: This is clearly marked as an algorithmic suggestion and never overrides human decisions.
    """
    needs = [n.lower() for n in (assistance_needs or [])]
    vuln = [v.lower() for v in (vulnerable_groups or [])]
    desc = (description or "").lower()

    critical_keywords = [
        "trapped", "submerged", "rising fast", "unconscious", "collapse",
        "drowning", "infant", "pregnant", "cardiac", "critical", "bleeding"
    ]
    has_critical_keyword = any(kw in desc for kw in critical_keywords)
    has_high_vulnerability = any("infant" in v or "disabled" in v or "elderly" in v or "pregnant" in v for v in vuln)
    has_rescue_boat_need = any("rescue" in n or "boat" in n or "medical" in n or "evacuation" in n for n in needs)

    if people_affected >= 10 or (has_critical_keyword and has_high_vulnerability) or (has_rescue_boat_need and people_affected >= 5):
        return (
            "Critical",
            "Automated Heuristic: High casualty risk detected due to vulnerable individuals, mass entrapment, or life-safety keywords."
        )
    elif people_affected >= 4 or has_rescue_boat_need or has_critical_keyword or category.lower() in ["flood", "fire", "earthquake"]:
        return (
            "High",
            "Automated Heuristic: Multi-person incident or urgent operational assistance needed."
        )
    elif people_affected >= 2 or category.lower() in ["cyclone", "landslide"]:
        return (
            "Medium",
            "Automated Heuristic: Standard priority response requested."
        )
    else:
        return (
            "Low",
            "Automated Heuristic: Localized incident with minimal immediate life-safety threat reported."
        )


def check_for_duplicates(
    db: Session,
    district: str,
    latitude: Optional[float],
    longitude: Optional[float],
    phone: str,
    exclude_id: Optional[int] = None
) -> Optional[int]:
    """
    Identifies potential duplicate reports based on proximity (<= 300 meters) or identical contact.
    Does NOT merge or delete records; only attaches reference to potential duplicate for human review.
    """
    query = db.query(models.EmergencyRequest).filter(
        models.EmergencyRequest.district == district,
        models.EmergencyRequest.response_status.notin_(["Resolved", "Cancelled", "Rejected"])
    )
    if exclude_id:
        query = query.filter(models.EmergencyRequest.id != exclude_id)

    candidates = query.order_by(models.EmergencyRequest.id.desc()).limit(30).all()

    for item in candidates:
        # Check phone match within same district
        if item.phone and phone and item.phone.strip() == phone.strip():
            return item.id
        
        # Check geographic proximity if coordinates are available
        if (
            latitude is not None and longitude is not None and
            item.latitude is not None and item.longitude is not None
        ):
            dist_km = calculate_distance_km(latitude, longitude, item.latitude, item.longitude)
            if dist_km <= 0.3: # within 300 meters
                return item.id

    return None
