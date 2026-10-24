import sys
import json
import time
import urllib.request
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import get_engine
from sqlalchemy import text

def main():
    timestamp = int(time.time())
    cit_email = f"ap.citizen.{timestamp}@example.com"
    cit_password = "CitizenSecure2026!"

    print("[TEST 1] Registering Citizen via http://localhost:5173/api/auth/register...")
    reg_payload = json.dumps({
        "email": cit_email,
        "password": cit_password,
        "full_name": "Ramana Murthy",
        "phone": "9848012345",
        "role": "citizen",
        "district": "NTR (Vijayawada)",
        "registered_address": "Singh Nagar, Vijayawada",
        "registered_latitude": 16.5342,
        "registered_longitude": 80.6415
    }).encode("utf-8")

    reg_req = urllib.request.Request(
        "http://localhost:5173/api/auth/register",
        data=reg_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(reg_req) as res:
        assert res.status == 201, f"Expected 201, got {res.status}"
        data = json.loads(res.read().decode("utf-8"))
        token = data["access_token"]
        user_id = data["user"]["id"]
        status_val = data["user"]["status"]
        print(f"   -> Citizen Registered Successfully! ID: {user_id}, Status: {status_val}")

    print("\n[TEST 2] Verifying Current Authenticated User via http://localhost:5173/api/auth/me...")
    me_req = urllib.request.Request(
        "http://localhost:5173/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(me_req) as res:
        assert res.status == 200, f"Expected 200, got {res.status}"
        me_data = json.loads(res.read().decode("utf-8"))
        print(f"   -> Verified User: {me_data['full_name']} ({me_data['role']})")

    print("\n[TEST 3] Submitting Emergency SOS via http://localhost:5173/api/requests...")
    sos_payload = json.dumps({
        "contact_name": "Ramana Murthy",
        "phone": "9848012345",
        "category": "Flood",
        "urgency": "Critical",
        "description": "Family of 4 stranded on first floor due to 5ft floodwater inundation. Need emergency rescue boat and potable drinking water.",
        "people_affected": 4,
        "assistance_needs": ["rescue", "water", "food"],
        "vulnerable_groups": ["Infants / Children", "Elderly Persons (60+)"],
        "district": "NTR (Vijayawada)",
        "locality": "Singh Nagar Main Road",
        "address": "D.No 24-11, Singh Nagar, Vijayawada",
        "latitude": 16.5342,
        "longitude": 80.6415,
        "location_type": "current_confirmed"
    }).encode("utf-8")

    sos_req = urllib.request.Request(
        "http://localhost:5173/api/requests",
        data=sos_payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
        method="POST"
    )
    with urllib.request.urlopen(sos_req) as res:
        assert res.status == 201, f"Expected 201, got {res.status}"
        sos_data = json.loads(res.read().decode("utf-8"))
        ref_code = sos_data["reference_code"]
        sos_id = sos_data["id"]
        response_status = sos_data["response_status"]
        print(f"   -> Emergency SOS Created! Code: {ref_code}, ID: {sos_id}, Status: {response_status}")

    print("\n[TEST 4] Retrieving Citizen Request History via http://localhost:5173/api/requests/my...")
    my_req = urllib.request.Request(
        "http://localhost:5173/api/requests/my",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(my_req) as res:
        assert res.status == 200, f"Expected 200, got {res.status}"
        my_list = json.loads(res.read().decode("utf-8"))
        matched = [r for r in my_list if r["reference_code"] == ref_code]
        assert len(matched) > 0, f"Reference code {ref_code} not found in my requests!"
        print(f"   -> Retrieved {len(my_list)} request(s). Target {ref_code} confirmed in list!")

    print("\n[TEST 5] Verifying Direct Persistence in MySQL Database (crisismap_db)...")
    engine = get_engine()
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id, reference_code, contact_name, response_status, category FROM emergency_requests WHERE reference_code = :code"),
            {"code": ref_code}
        ).fetchone()
        assert row is not None, "Record not found in MySQL!"
        print(f"   -> MySQL Confirmed Persistence! DB Record: ID={row[0]}, Code={row[1]}, Name={row[2]}, Status={row[3]}, Category={row[4]}")

    print("\n======================================================")
    print("ALL CITIZEN FLOW INTEGRATION TESTS PASSED 100%!")
    print("======================================================")

if __name__ == "__main__":
    main()
