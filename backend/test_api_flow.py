import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def request_json(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"raw": err_body}

def run_tests():
    print("[1] Testing /health and /health/db...")
    code, res = request_json("GET", "/health")
    assert code == 200 and res.get("status") == "healthy", f"Health check failed: {code} {res}"
    print("    /health -> PASS (200 OK)")

    code, res = request_json("GET", "/health/db")
    assert code == 200 and res.get("database") == "connected", f"DB check failed: {code} {res}"
    print("    /health/db -> PASS (200 OK, connected)")

    print("\n[2] Testing Public Registration & Role Safeguards...")
    # Attempt to register as admin (must fail)
    code, res = request_json("POST", "/api/auth/register", {
        "email": "hacker@example.com",
        "password": "Password123!",
        "full_name": "Fake Admin",
        "role": "admin"
    })
    assert code == 400, f"Expected 400 for admin registration, got: {code} {res}"
    print("    Admin self-registration rejection -> PASS (400 Forbidden)")

    # Citizen registration
    cit_email = f"citizen.test{int(urllib.request.time.time())}@example.com"
    code, cit_res = request_json("POST", "/api/auth/register", {
        "email": cit_email,
        "password": "CitizenPassword123!",
        "full_name": "K. Venkatesh",
        "phone": "9849012345",
        "role": "citizen",
        "district": "NTR (Vijayawada)",
        "registered_address": "Bhavanipuram, Vijayawada",
        "registered_latitude": 16.5193,
        "registered_longitude": 80.6305
    })
    assert code == 201 and cit_res["user"]["status"] == "active", f"Citizen reg failed: {code} {cit_res}"
    cit_token = cit_res["access_token"]
    print("    Citizen registration & activation -> PASS (201 Created, Active)")

    # Responder registration (must be pending_approval)
    resp_email = f"responder.test{int(urllib.request.time.time())}@example.com"
    code, resp_res = request_json("POST", "/api/auth/register", {
        "email": resp_email,
        "password": "ResponderPassword123!",
        "full_name": "Inspector M. Rao",
        "phone": "9440155555",
        "role": "responder",
        "organization_name": "SDRF Flood Unit 2",
        "district": "NTR (Vijayawada)",
        "title_or_designation": "Rescue Unit Commander"
    })
    assert code == 201 and resp_res["user"]["status"] == "pending_approval", f"Responder reg failed: {code} {resp_res}"
    resp_user_id = resp_res["user"]["id"]
    print("    Responder registration -> PASS (201 Created, Pending Approval)")

    # Unapproved responder trying to view requests (must be blocked 403)
    resp_token = resp_res["access_token"]
    code, res = request_json("GET", "/api/requests", token=resp_token)
    assert code == 403, f"Expected 403 for unapproved responder, got: {code} {res}"
    print("    Unapproved responder access control -> PASS (403 Forbidden)")

    print("\n[3] Testing Admin Login & Approval Flow...")
    code, admin_login = request_json("POST", "/api/auth/login", {
        "email": "admin@crisismap.org",
        "password": "AdminSecure2026!"
    })
    assert code == 200, f"Admin login failed: {code} {admin_login}"
    admin_token = admin_login["access_token"]
    print("    Admin login -> PASS (200 OK)")

    # Approve the responder
    code, approve_res = request_json("PATCH", f"/api/admin/users/{resp_user_id}/status", {"status": "active"}, token=admin_token)
    assert code == 200 and approve_res["status"] == "active", f"Approve responder failed: {code} {approve_res}"
    print("    Admin approval of responder -> PASS (200 OK, Activated)")

    # Re-login responder to verify active access
    code, resp_relogin = request_json("POST", "/api/auth/login", {
        "email": resp_email,
        "password": "ResponderPassword123!"
    })
    assert code == 200, f"Responder login failed: {code} {resp_relogin}"
    resp_token = resp_relogin["access_token"]
    code, res = request_json("GET", "/api/requests", token=resp_token)
    assert code == 200, f"Active responder requests list failed: {code} {res}"
    print("    Approved responder access to request queue -> PASS (200 OK)")

    print("\n[4] Testing Emergency Assistance Request Lifecycle...")
    # Citizen creates emergency request
    code, req_created = request_json("POST", "/api/requests", {
        "contact_name": "K. Venkatesh",
        "phone": "9849012345",
        "category": "Flood",
        "description": "Rising flood waters trapped 6 elderly people on second floor. Immediate evacuation boat needed.",
        "people_affected": 6,
        "assistance_needs": ["Evacuation / Rescue Boat", "Emergency Medical Assistance"],
        "vulnerable_groups": ["Elderly"],
        "district": "NTR (Vijayawada)",
        "locality": "Singh Nagar, Near Bridge",
        "address": "Door 12-4, Singh Nagar Main Rd",
        "latitude": 16.5388,
        "longitude": 80.6277,
        "location_type": "current_confirmed"
    })
    assert code == 201, f"Create emergency request failed: {code} {req_created}"
    req_id = req_created["id"]
    ref_code = req_created["reference_code"]
    assert req_created["ai_urgency_suggestion"] in ["Critical", "High"], f"Unexpected AI urgency: {req_created}"
    print(f"    Emergency request created -> PASS (ID: {req_id}, Code: {ref_code}, AI Urgency: {req_created['ai_urgency_suggestion']})")

    # Duplicate detection test (same phone + same district)
    code, dup_req = request_json("POST", "/api/requests", {
        "contact_name": "K. Venkatesh",
        "phone": "9849012345",
        "category": "Flood",
        "description": "Follow up: water still rising.",
        "people_affected": 6,
        "district": "NTR (Vijayawada)",
        "latitude": 16.5388,
        "longitude": 80.6277
    })
    assert code == 201 and dup_req["potential_duplicate_of_id"] == req_id, f"Duplicate detection failed: {dup_req}"
    print(f"    Duplicate detection heuristic -> PASS (Flagged duplicate of #{req_id} non-destructively)")

    # Responder assigns request
    code, assign_res = request_json("POST", f"/api/requests/{req_id}/assign", {
        "responder_name": "SDRF Flood Unit 2",
        "note": "Rescue boat team Alpha mobilized with life jackets."
    }, token=resp_token)
    assert code == 200 and assign_res["response_status"] == "Assigned", f"Assignment failed: {code} {assign_res}"
    print("    Responder assignment -> PASS (Assigned)")

    # Responder updates status to In Progress
    code, prog_res = request_json("PATCH", f"/api/requests/{req_id}/status", {
        "new_status": "In Progress",
        "note": "Team on site. Evacuation underway."
    }, token=resp_token)
    assert code == 200 and prog_res["response_status"] == "In Progress", f"Status update failed: {code} {prog_res}"
    print("    Status progression -> PASS (In Progress)")

    # Add coordination note
    code, note_res = request_json("POST", f"/api/requests/{req_id}/notes", {
        "note": "All 6 individuals secured safely aboard rescue craft. Transferring to relief center."
    }, token=resp_token)
    assert code == 200, f"Add note failed: {code} {note_res}"
    print("    Audit timeline note -> PASS (Logged)")

    # Resolve request
    code, res_done = request_json("PATCH", f"/api/requests/{req_id}/status", {
        "new_status": "Resolved",
        "note": "Citizens safely brought to relief shelter."
    }, token=resp_token)
    assert code == 200 and res_done["response_status"] == "Resolved", f"Resolve failed: {code} {res_done}"
    print("    Resolution -> PASS (Resolved)")

    print("\n[5] Testing Real Database Statistics Endpoint...")
    code, stats_res = request_json("GET", "/api/admin/stats", token=resp_token)
    assert code == 200 and stats_res["total_requests"] >= 2, f"Stats failed: {code} {stats_res}"
    print(f"    Real database stats -> PASS (Total Requests: {stats_res['total_requests']}, Resolved: {stats_res['resolved_count']})")

    print("\n==========================================")
    print("ALL API AND DATABASE TESTS PASSED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"[FAIL] {e}")
        sys.exit(1)
