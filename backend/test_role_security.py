import json
import time
import urllib.request
import urllib.error
import sys
from pathlib import Path

# Base API URL
API_BASE = "http://127.0.0.1:8000/api"

# Unique test run timestamp for clean isolation
RUN_ID = int(time.time())

# Test account identifiers
CITIZEN_A_EMAIL = f"citizen.sec.a.{RUN_ID}@example.com"
CITIZEN_B_EMAIL = f"citizen.sec.b.{RUN_ID}@example.com"
NGO_EMAIL = f"ngo.relief.{RUN_ID}@example.com"
GOV_EMAIL = f"gov.official.{RUN_ID}@ap.gov.in"
UNPROVISIONED_GOV_EMAIL = f"unprov.officer.{RUN_ID}@ap.gov.in"
ADMIN_EMAIL = "admin@crisismap.org"

# Secure credentials for testing
SEC_PASSWORD = "SecAuthTestPass2026!"
ADMIN_PASSWORD = "AdminSecure2026!"

# Track IDs for cleanup
created_user_ids = []
created_request_ids = []

def make_request(endpoint, method="GET", data=None, token=None):
    url = f"{API_BASE}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as res:
            res_body = res.read().decode("utf-8")
            status_code = res.status
            try:
                body_json = json.loads(res_body) if res_body else {}
            except Exception:
                body_json = {"raw": res_body}
            return status_code, body_json
    except urllib.error.HTTPError as he:
        err_body = he.read().decode("utf-8")
        try:
            body_json = json.loads(err_body) if err_body else {}
        except Exception:
            body_json = {"raw": err_body}
        return he.code, body_json


def run_all_tests():
    print("=" * 78)
    print("CRISISMAP AP — ROLE SECURITY & ACCESS CONTROL VERIFICATION SUITE")
    print("=" * 78)
    results = {}

    admin_token = None
    citizen_a_token = None
    citizen_b_token = None
    ngo_token = None
    gov_token = None

    citizen_a_user_id = None
    citizen_b_user_id = None
    ngo_user_id = None
    gov_user_id = None
    emergency_req_a_id = None

    # Step 0: Obtain state administrator token for privileged tests
    status, body = make_request("/auth/login", method="POST", data={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if status == 200:
        admin_token = body.get("access_token")
        print("[SETUP] State Administrator session authenticated successfully.")
    else:
        print(f"[FATAL SETUP] Could not login as administrator ({status}): {body.get('detail')}")
        sys.exit(1)

    # -------------------------------------------------------------------------
    # TEST 1: Citizen registration immediately creates an active citizen account
    # -------------------------------------------------------------------------
    print("\n[TEST 1] Citizen registration immediately creates an active citizen account...")
    status, body = make_request("/auth/register", method="POST", data={
        "full_name": "K. Srinivas Citizen",
        "email": CITIZEN_A_EMAIL,
        "phone": "9876543210",
        "password": SEC_PASSWORD,
        "role": "citizen",
        "district": "NTR (Vijayawada)",
        "registered_address": "MG Road, Vijayawada"
    })
    assert status == 201, f"Expected 201, got {status}: {body}"
    user_a = body.get("user", {})
    citizen_a_token = body.get("access_token")
    citizen_a_user_id = user_a.get("id")
    created_user_ids.append(citizen_a_user_id)

    assert user_a.get("role") == "citizen", f"Expected role 'citizen', got {user_a.get('role')}"
    assert user_a.get("status") == "active", f"Expected status 'active', got {user_a.get('status')}"
    results["TEST 1"] = f"PASS (Created Citizen ID {citizen_a_user_id}, Status: {user_a.get('status')})"
    print(f" -> {results['TEST 1']}")

    # Also register Citizen B for private data isolation testing
    status_b, body_b = make_request("/auth/register", method="POST", data={
        "full_name": "L. Lakshmi Citizen",
        "email": CITIZEN_B_EMAIL,
        "phone": "9123456780",
        "password": SEC_PASSWORD,
        "role": "citizen",
        "district": "Guntur",
        "registered_address": "Brodipet, Guntur"
    })
    citizen_b_token = body_b.get("access_token")
    citizen_b_user_id = body_b.get("user", {}).get("id")
    created_user_ids.append(citizen_b_user_id)

    # -------------------------------------------------------------------------
    # TEST 2: Citizens can log in and submit SOS requests
    # -------------------------------------------------------------------------
    print("\n[TEST 2] Citizens can log in and submit SOS requests...")
    # Login verification
    l_status, l_body = make_request("/auth/login", method="POST", data={
        "email": CITIZEN_A_EMAIL,
        "password": SEC_PASSWORD
    })
    assert l_status == 200, f"Expected 200 on login, got {l_status}"
    citizen_a_token = l_body.get("access_token")

    # SOS submission
    sos_status, sos_body = make_request("/requests", method="POST", data={
        "contact_name": "K. Srinivas",
        "phone": "9876543210",
        "category": "Medical Assistance",
        "urgency": "High",
        "description": "Isolated flood test scenario: elderly resident requires dialysis transport.",
        "people_affected": 2,
        "assistance_needs": ["Medical Assistance", "Emergency Evacuation"],
        "district": "NTR (Vijayawada)",
        "locality": "Krishnalanka",
        "address": "House 12-4, Krishnalanka, Vijayawada",
        "latitude": 16.5012,
        "longitude": 80.6432
    }, token=citizen_a_token)
    assert sos_status == 201, f"Expected 201 on SOS submission, got {sos_status}: {sos_body}"
    emergency_req_a_id = sos_body.get("id")
    created_request_ids.append(emergency_req_a_id)
    assert sos_body.get("reporter_id") == citizen_a_user_id
    results["TEST 2"] = f"PASS (Logged in, submitted SOS #{emergency_req_a_id}, Ref: {sos_body.get('reference_code')})"
    print(f" -> {results['TEST 2']}")

    # -------------------------------------------------------------------------
    # TEST 3: NGO registration creates a pending application
    # -------------------------------------------------------------------------
    print("\n[TEST 3] NGO registration creates a pending application...")
    ngo_status, ngo_body = make_request("/auth/register", method="POST", data={
        "full_name": "R. Kumar Director",
        "email": NGO_EMAIL,
        "phone": "9988776655",
        "password": SEC_PASSWORD,
        "role": "responder",
        "organization_name": f"AP Coastal Relief Foundation {RUN_ID}",
        "district": "Krishna",
        "title_or_designation": "Disaster Relief Coordinator"
    })
    assert ngo_status == 201, f"Expected 201, got {ngo_status}: {ngo_body}"
    ngo_user = ngo_body.get("user", {})
    ngo_token = ngo_body.get("access_token")
    ngo_user_id = ngo_user.get("id")
    created_user_ids.append(ngo_user_id)

    assert ngo_user.get("role") == "responder", f"Expected 'responder', got {ngo_user.get('role')}"
    assert ngo_user.get("status") == "pending_approval", f"Expected 'pending_approval', got {ngo_user.get('status')}"
    results["TEST 3"] = f"PASS (Created NGO User ID {ngo_user_id}, Status: {ngo_user.get('status')})"
    print(f" -> {results['TEST 3']}")

    # -------------------------------------------------------------------------
    # TEST 4: Pending NGOs cannot access protected NGO features
    # -------------------------------------------------------------------------
    print("\n[TEST 4] Pending NGOs cannot access protected NGO features...")
    p_status, p_body = make_request("/requests", method="GET", token=ngo_token)
    assert p_status == 403, f"Expected 403 Forbidden for pending NGO, got {p_status}: {p_body}"
    assert "awaiting" in p_body.get("detail", "").lower() or "approval" in p_body.get("detail", "").lower(), p_body
    results["TEST 4"] = f"PASS (Pending NGO blocked with HTTP 403: {p_body.get('detail')})"
    print(f" -> {results['TEST 4']}")

    # -------------------------------------------------------------------------
    # TEST 5: An authorized administrator can approve an NGO application
    # -------------------------------------------------------------------------
    print("\n[TEST 5] An authorized administrator can approve an NGO application...")
    appr_status, appr_body = make_request(f"/admin/users/{ngo_user_id}/status", method="PATCH", data={
        "status": "active"
    }, token=admin_token)
    assert appr_status == 200, f"Expected 200 on approval, got {appr_status}: {appr_body}"
    assert appr_body.get("status") == "active", f"Expected status active, got {appr_body.get('status')}"
    results["TEST 5"] = f"PASS (Administrator approved NGO User ID {ngo_user_id} -> status: active)"
    print(f" -> {results['TEST 5']}")

    # -------------------------------------------------------------------------
    # TEST 6: An approved NGO can access permitted features
    # -------------------------------------------------------------------------
    print("\n[TEST 6] An approved NGO can access permitted features...")
    # Re-login to refresh credentials
    n_login_status, n_login_body = make_request("/auth/login", method="POST", data={
        "email": NGO_EMAIL,
        "password": SEC_PASSWORD
    })
    assert n_login_status == 200, f"Expected 200, got {n_login_status}"
    active_ngo_token = n_login_body.get("access_token")

    q_status, q_body = make_request("/requests", method="GET", token=active_ngo_token)
    assert q_status == 200, f"Expected 200 for approved NGO, got {q_status}: {q_body}"
    assert isinstance(q_body, list), "Expected list of emergency requests"
    results["TEST 6"] = f"PASS (Approved NGO accessed /api/requests queue, {len(q_body)} requests visible)"
    print(f" -> {results['TEST 6']}")

    # -------------------------------------------------------------------------
    # TEST 7: Government self-registration is rejected
    # -------------------------------------------------------------------------
    print("\n[TEST 7] Government self-registration is rejected...")
    reg_gov_status, reg_gov_body = make_request("/auth/register", method="POST", data={
        "full_name": "Fake Official Attempt",
        "email": f"hacker.official.{RUN_ID}@ap.gov.in",
        "phone": "9999999999",
        "password": SEC_PASSWORD,
        "role": "government_official"
    })
    assert reg_gov_status == 400, f"Expected 400 Bad Request, got {reg_gov_status}: {reg_gov_body}"
    assert "disabled" in reg_gov_body.get("detail", "").lower() or "provisioned" in reg_gov_body.get("detail", "").lower(), reg_gov_body

    # Also verify 'admin' self-registration is rejected
    reg_adm_status, reg_adm_body = make_request("/auth/register", method="POST", data={
        "full_name": "Fake Admin Attempt",
        "email": f"hacker.admin.{RUN_ID}@ap.gov.in",
        "phone": "9999999998",
        "password": SEC_PASSWORD,
        "role": "admin"
    })
    assert reg_adm_status == 400, f"Expected 400 Bad Request, got {reg_adm_status}: {reg_adm_body}"
    results["TEST 7"] = f"PASS (Public self-registration rejected with HTTP 400: '{reg_gov_body.get('detail')}')"
    print(f" -> {results['TEST 7']}")

    # -------------------------------------------------------------------------
    # TEST 8: An unprovisioned government account cannot log in
    # -------------------------------------------------------------------------
    print("\n[TEST 8] An unprovisioned government account cannot log in...")
    unprov_status, unprov_body = make_request("/auth/login", method="POST", data={
        "email": UNPROVISIONED_GOV_EMAIL,
        "password": SEC_PASSWORD
    })
    assert unprov_status == 401, f"Expected 401 Unauthorized, got {unprov_status}: {unprov_body}"
    results["TEST 8"] = f"PASS (Unprovisioned account rejected with HTTP 401: '{unprov_body.get('detail')}')"
    print(f" -> {results['TEST 8']}")

    # -------------------------------------------------------------------------
    # TEST 9: A properly provisioned government account can log in
    # -------------------------------------------------------------------------
    print("\n[TEST 9] A properly provisioned government account can log in...")
    # Provision dedicated government test account via the secure provisioning procedure
    from app.cli import create_admin
    create_admin(
        email=GOV_EMAIL,
        password=SEC_PASSWORD,
        full_name="B. Venkat Rao DDMO",
        phone="1070",
        district="NTR District Disaster Center",
        role="government_official"
    )

    prov_status, prov_body = make_request("/auth/login", method="POST", data={
        "email": GOV_EMAIL,
        "password": SEC_PASSWORD
    })
    assert prov_status == 200, f"Expected 200 OK, got {prov_status}: {prov_body}"
    gov_token = prov_body.get("access_token")
    gov_user = prov_body.get("user", {})
    gov_user_id = gov_user.get("id")
    created_user_ids.append(gov_user_id)
    assert gov_user.get("role") == "government_official", f"Expected government_official, got {gov_user.get('role')}"
    assert gov_user.get("status") == "active", f"Expected active, got {gov_user.get('status')}"
    results["TEST 9"] = f"PASS (Provisioned Government Official logged in: Role={gov_user.get('role')}, Status={gov_user.get('status')})"
    print(f" -> {results['TEST 9']}")

    # -------------------------------------------------------------------------
    # TEST 10: Citizens cannot access government or administrator APIs
    # -------------------------------------------------------------------------
    print("\n[TEST 10] Citizens cannot access government or administrator APIs...")
    # 1. Citizen attempts to view general emergency requests queue
    cit_q_status, cit_q_body = make_request("/requests", method="GET", token=citizen_a_token)
    assert cit_q_status == 403, f"Expected 403, got {cit_q_status}: {cit_q_body}"

    # 2. Citizen attempts to list administrative users
    cit_adm_status, cit_adm_body = make_request("/admin/users", method="GET", token=citizen_a_token)
    assert cit_adm_status == 403, f"Expected 403, got {cit_adm_status}: {cit_adm_body}"

    # 3. Citizen attempts to access verification endpoint
    cit_ver_status, cit_ver_body = make_request(f"/requests/{emergency_req_a_id}/verify", method="PATCH", data={
        "verification_status": "Verified",
        "urgency": "Low"
    }, token=citizen_a_token)
    assert cit_ver_status == 403, f"Expected 403, got {cit_ver_status}: {cit_ver_body}"

    results["TEST 10"] = "PASS (Citizen access to /api/requests, /api/admin/users, and /api/requests/{id}/verify blocked with HTTP 403)"
    print(f" -> {results['TEST 10']}")

    # -------------------------------------------------------------------------
    # TEST 11: NGO accounts cannot perform administrator-only operations
    # -------------------------------------------------------------------------
    print("\n[TEST 11] NGO accounts cannot perform administrator-only operations...")
    # NGO attempts to approve another user
    ngo_adm_status, ngo_adm_body = make_request(f"/admin/users/{citizen_a_user_id}/status", method="PATCH", data={
        "status": "suspended"
    }, token=active_ngo_token)
    assert ngo_adm_status == 403, f"Expected 403, got {ngo_adm_status}: {ngo_adm_body}"

    # NGO attempts to list users
    ngo_u_status, ngo_u_body = make_request("/admin/users", method="GET", token=active_ngo_token)
    assert ngo_u_status == 403, f"Expected 403, got {ngo_u_status}: {ngo_u_body}"

    # NGO attempts to delete a shelter
    ngo_del_status, ngo_del_body = make_request("/shelters/1", method="DELETE", token=active_ngo_token)
    assert ngo_del_status == 403, f"Expected 403, got {ngo_del_status}: {ngo_del_body}"

    results["TEST 11"] = "PASS (NGO accounts blocked with HTTP 403 from administrative operations /admin/users and shelter deletions)"
    print(f" -> {results['TEST 11']}")

    # -------------------------------------------------------------------------
    # TEST 12: Direct URL access does not bypass authorization
    # -------------------------------------------------------------------------
    print("\n[TEST 12] Direct URL access does not bypass authorization...")
    # 1. Unauthenticated direct URL access to protected requests queue
    unauth_status, unauth_body = make_request("/requests", method="GET", token=None)
    assert unauth_status == 401, f"Expected 401 Unauthorized without token, got {unauth_status}"

    # 2. Unauthenticated direct URL access to emergency request details by ID
    unauth_req_status, unauth_req_body = make_request(f"/requests/{emergency_req_a_id}", method="GET", token=None)
    assert unauth_req_status == 401, f"Expected 401 Unauthorized without token, got {unauth_req_status}"

    # 3. Citizen B attempts direct URL access to Citizen A's private request
    snoop_status, snoop_body = make_request(f"/requests/{emergency_req_a_id}", method="GET", token=citizen_b_token)
    assert snoop_status == 403, f"Expected 403 Forbidden for cross-citizen request access, got {snoop_status}: {snoop_body}"
    assert "private" in snoop_body.get("detail", "").lower() or "authorized" in snoop_body.get("detail", "").lower()

    # 4. Citizen A accesses their OWN private request -> 200 OK
    own_status, own_body = make_request(f"/requests/{emergency_req_a_id}", method="GET", token=citizen_a_token)
    assert own_status == 200, f"Expected 200 OK for own request, got {own_status}"

    results["TEST 12"] = "PASS (Unauthenticated direct access returns 401; cross-citizen ID snooping blocked with 403; own request returns 200)"
    print(f" -> {results['TEST 12']}")

    # -------------------------------------------------------------------------
    # TEST 13: Existing citizen and NGO login functionality remains operational
    # -------------------------------------------------------------------------
    print("\n[TEST 13] Existing citizen and NGO login functionality remains operational...")
    # Citizen login
    cl_status, cl_body = make_request("/auth/login", method="POST", data={
        "email": CITIZEN_A_EMAIL,
        "password": SEC_PASSWORD
    })
    assert cl_status == 200 and cl_body.get("access_token")
    assert cl_body.get("user", {}).get("role") == "citizen"

    # NGO login
    nl_status, nl_body = make_request("/auth/login", method="POST", data={
        "email": NGO_EMAIL,
        "password": SEC_PASSWORD
    })
    assert nl_status == 200 and nl_body.get("access_token")
    assert nl_body.get("user", {}).get("role") == "responder"

    results["TEST 13"] = "PASS (Citizen and NGO accounts authenticated with valid JWTs and matching backend roles)"
    print(f" -> {results['TEST 13']}")

    # -------------------------------------------------------------------------
    # CLEANUP: Remove isolated test records from MySQL
    # -------------------------------------------------------------------------
    print("\n[CLEANUP] Removing isolated test records from MySQL database...")
    from app.database import get_db
    from app.models import User, EmergencyRequest, RequestUpdate
    db = next(get_db())
    try:
        if created_request_ids:
            db.query(RequestUpdate).filter(RequestUpdate.request_id.in_(created_request_ids)).delete(synchronize_session=False)
            db.query(EmergencyRequest).filter(EmergencyRequest.id.in_(created_request_ids)).delete(synchronize_session=False)
            print(f" -> Cleaned up {len(created_request_ids)} isolated test emergency requests and timeline logs.")
        if created_user_ids:
            db.query(User).filter(User.id.in_(created_user_ids)).delete(synchronize_session=False)
            print(f" -> Cleaned up {len(created_user_ids)} isolated test user accounts.")
        db.commit()
    except Exception as ex:
        print(f" -> Cleanup notice: {ex}")
        db.rollback()
    finally:
        db.close()

    print("\n" + "=" * 78)
    print("ALL 13 ROLE SECURITY & ACCESS CONTROL VERIFICATION TESTS PASSED 100%!")
    print("=" * 78)
    for test_name, res in results.items():
        print(f"  {test_name.ljust(10)}: {res}")
    print("=" * 78)


if __name__ == "__main__":
    run_all_tests()
