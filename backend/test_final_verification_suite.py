"""
CrisisMap-AP Final Verification Test Suite
Covers all requirements from Parts A, B, C, D, and E:
- NGO Registration, Approval Synchronization, Status Persistence, Login, Protected Endpoints, Password Reset
- Government Official Access Request, Manual Verification & Provisioning, Role Isolation, Rejection of Unauthorized Users
- Admin Oversight & Authorization Enforcement
- Existing Data Preservation Checks
"""
import urllib.request
import urllib.error
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def make_request(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            try:
                body_data = json.loads(resp_body) if resp_body else {}
            except Exception:
                body_data = {"raw_text": resp_body[:300]}
            return resp.status, body_data
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"raw": err_body}
        return e.code, parsed
    except Exception as e:
        return 500, {"error": str(e)}

def run_suite():
    ts = int(time.time())
    results = []
    
    def record(category, test_name, passed, detail):
        status_str = "PASS" if passed else "FAIL"
        results.append((category, test_name, passed, detail))
        print(f"[{status_str}] [{category}] {test_name}: {detail}")

    print("================================================================================")
    print(" CRISISMAP-AP — FINAL VERIFICATION & REGRESSION SUITE")
    print("================================================================================\n")

    # -------------------------------------------------------------------------
    # PART 0: Existing Database Records Preservation
    # -------------------------------------------------------------------------
    # Verify Admin account exists and can log in
    admin_code, admin_data = make_request("POST", "/api/auth/login", {
        "email": "admin@crisismap.org",
        "password": "AdminPass123!"
    })
    admin_token = admin_data.get("access_token")
    admin_ok = admin_code == 200 and admin_data.get("user", {}).get("role") == "admin"
    record("PRESERVATION", "Admin Account Preservation", admin_ok,
           f"HTTP {admin_code}, role='{admin_data.get('user', {}).get('role')}'")

    # Verify existing registered NGO account is preserved
    # Search for existing user ravitejareddyyadika@gmail.com via admin users endpoint
    code_users, data_users = make_request("GET", "/api/admin/users", token=admin_token)
    existing_ngo_found = any(u.get("email") == "ravitejareddyyadika@gmail.com" for u in data_users) if isinstance(data_users, list) else False
    record("PRESERVATION", "Existing NGO Account Preservation", existing_ngo_found,
           f"Found 'ravitejareddyyadika@gmail.com' in database records: {existing_ngo_found}")

    # -------------------------------------------------------------------------
    # PART A: NGO Registration, Approval Synchronization & Authentication
    # -------------------------------------------------------------------------
    ngo_email = f"ngo.test.{ts}@crisisaid.org"
    ngo_phone = "9849012345"
    ngo_pass = "SecureNgo123!"
    ngo_org_name = f"Andhra Coastal Relief {ts}"

    # A.1 Registration creates account with pending_approval
    code_reg, data_reg = make_request("POST", "/api/auth/register", {
        "full_name": "Rao Bahadur",
        "email": f"  {ngo_email.upper()}  ",  # Test whitespace & uppercase handling
        "phone": ngo_phone,
        "password": ngo_pass,
        "role": "responder",
        "organization_name": ngo_org_name,
        "district": "Guntur"
    })
    ngo_user_id = data_reg.get("user", {}).get("id")
    reg_ok = code_reg == 201 and data_reg.get("user", {}).get("status") == "pending_approval"
    record("NGO_AUTH", "NGO Registration & Pending Status", reg_ok,
           f"HTTP {code_reg}, status='{data_reg.get('user', {}).get('status')}', user_id={ngo_user_id}")

    # A.2 Pending NGO cannot log in (returns 403 Forbidden with informative message)
    code_pend_login, data_pend_login = make_request("POST", "/api/auth/login", {
        "email": ngo_email,
        "password": ngo_pass
    })
    pend_login_blocked = code_pend_login == 403 and "pending" in data_pend_login.get("detail", "").lower()
    record("NGO_AUTH", "Pending NGO Login Denial", pend_login_blocked,
           f"HTTP {code_pend_login}, detail='{data_pend_login.get('detail')}'")

    # A.3 Incorrect password rejection
    code_wrong_pw, data_wrong_pw = make_request("POST", "/api/auth/login", {
        "email": ngo_email,
        "password": "WrongPassword999!"
    })
    wrong_pw_rejected = code_wrong_pw == 401
    record("NGO_AUTH", "Wrong Password Rejection", wrong_pw_rejected,
           f"HTTP {code_wrong_pw}, detail='{data_wrong_pw.get('detail')}'")

    # A.4 Admin approval workflow and persistence
    code_appr, data_appr = make_request("PATCH", f"/api/admin/users/{ngo_user_id}/status", {
        "status": "active",
        "note": "Verified credentials with State Disaster Response Force"
    }, token=admin_token)
    appr_ok = code_appr == 200 and data_appr.get("status") == "active"
    record("NGO_AUTH", "Admin Approval & Status Persistence", appr_ok,
           f"HTTP {code_appr}, new status='{data_appr.get('status')}'")

    # A.5 Approved NGO immediate login
    code_ngo_log, data_ngo_log = make_request("POST", "/api/auth/login", {
        "email": ngo_email,
        "password": ngo_pass
    })
    ngo_token = data_ngo_log.get("access_token")
    ngo_role = data_ngo_log.get("user", {}).get("role")
    ngo_log_ok = code_ngo_log == 200 and ngo_role == "responder" and bool(ngo_token)
    record("NGO_AUTH", "Approved NGO Immediate Login", ngo_log_ok,
           f"HTTP {code_ngo_log}, role='{ngo_role}', token_present={bool(ngo_token)}")

    # A.6 Approved NGO reaches protected responder operations
    code_ngo_ops, data_ngo_ops = make_request("GET", "/api/admin/stats", token=ngo_token)
    ngo_ops_ok = code_ngo_ops == 200 and "total_requests" in data_ngo_ops
    record("NGO_AUTH", "Approved NGO Access to Protected Operations", ngo_ops_ok,
           f"HTTP {code_ngo_ops}, total_requests={data_ngo_ops.get('total_requests')}")

    # A.7 NGO role isolation: cannot perform admin user management
    code_ngo_admin_deny, _ = make_request("GET", "/api/admin/users", token=ngo_token)
    record("NGO_AUTH", "NGO Role Isolation (Admin Denied)", code_ngo_admin_deny == 403,
           f"HTTP {code_ngo_admin_deny} (Expected 403 Forbidden)")

    # A.8 Secure Password Reset Workflow (Self-Service)
    new_ngo_pass = "ResetNgoPass456!"
    code_reset, data_reset = make_request("POST", "/api/auth/reset-password", {
        "email": ngo_email,
        "phone": ngo_phone,
        "new_password": new_ngo_pass
    })
    reset_ok = code_reset == 200 and data_reset.get("success") is True
    
    # Verify login with new password works
    code_new_log, data_new_log = make_request("POST", "/api/auth/login", {
        "email": ngo_email,
        "password": new_ngo_pass
    })
    new_log_ok = code_new_log == 200 and bool(data_new_log.get("access_token"))
    record("NGO_AUTH", "Secure Password Reset Workflow", reset_ok and new_log_ok,
           f"Reset HTTP {code_reset}, Login with new password HTTP {code_new_log}")

    # -------------------------------------------------------------------------
    # PART B: Government Official Access Request, Verification & Provisioning
    # -------------------------------------------------------------------------
    gov_email = f"collector.test.{ts}@ap.gov.in"
    gov_phone = "9440123456"
    gov_pass = "GovSecret2026!"
    gov_emp_id = f"AP-REV-{ts}"

    # B.1 Public Registration cannot create government accounts directly
    code_fake_gov, _ = make_request("POST", "/api/auth/register", {
        "full_name": "Fake Official",
        "email": f"fake.gov.{ts}@example.com",
        "phone": "9999999999",
        "password": "Password123!",
        "role": "government_official"
    })
    # If registered via register endpoint, role should be coerced to citizen, or rejected (400)
    code_fake_login, data_fake_login = make_request("POST", "/api/auth/login", {
        "email": f"fake.gov.{ts}@example.com",
        "password": "Password123!"
    })
    fake_role = data_fake_login.get("user", {}).get("role")
    record("GOV_SECURITY", "Public Registration Cannot Grant Govt Role", fake_role != "government_official",
           f"Registration code {code_fake_gov}, assigned role: '{fake_role}' (Never 'government_official')")

    # B.2 Submit Official Access Request
    code_req, data_req = make_request("POST", "/api/auth/government/request-access", {
        "full_name": "Sri K. Venkateswara Rao, IAS",
        "email": gov_email,
        "phone": gov_phone,
        "department": "Revenue & Disaster Management",
        "designation": "Joint Collector & Additional District Magistrate",
        "district": "Visakhapatnam",
        "employee_id": gov_emp_id,
        "verification_details": "Gov ID card verified against AP Employee Portal APDMIS-2026",
        "password": gov_pass
    })
    gov_req_id = data_req.get("id")
    req_ok = code_req == 201 and data_req.get("status") == "pending" and bool(gov_req_id)
    record("GOV_WORKFLOW", "Official Access Request Submission", req_ok,
           f"HTTP {code_req}, status='{data_req.get('status')}', request_id={gov_req_id}")

    # B.3 Track Request Status (Public/Official lookup without leaking secrets)
    code_status, data_status = make_request("GET", f"/api/auth/government/request-status?email={gov_email}")
    status_ok = code_status == 200 and data_status.get("status") == "pending" and "password" not in data_status
    record("GOV_WORKFLOW", "Track Access Request Status", status_ok,
           f"HTTP {code_status}, status='{data_status.get('status')}', designation='{data_status.get('designation')}'")

    # B.4 Unprovisioned Official Login Denial (returns 403 Forbidden with clear reason)
    code_unprov_log, data_unprov_log = make_request("POST", "/api/auth/login", {
        "email": gov_email,
        "password": gov_pass
    })
    unprov_denied = code_unprov_log == 403 and "pending" in data_unprov_log.get("detail", "").lower()
    record("GOV_WORKFLOW", "Unprovisioned Official Login Denial", unprov_denied,
           f"HTTP {code_unprov_log}, detail='{data_unprov_log.get('detail')}'")

    # B.5 Unauthorized User Cannot Approve Request
    # NGO attempts to approve government request
    code_ngo_approve, _ = make_request("PATCH", f"/api/admin/government-requests/{gov_req_id}/decision", {
        "status": "approved",
        "admin_notes": "Attempted bypass"
    }, token=ngo_token)
    record("GOV_SECURITY", "Unauthorized User Cannot Approve Official", code_ngo_approve == 403,
           f"HTTP {code_ngo_approve} (Expected 403 Forbidden)")

    # B.6 Administrator Reviews Requests
    code_list_gov, data_list_gov = make_request("GET", "/api/admin/government-requests?status=pending", token=admin_token)
    list_ok = code_list_gov == 200 and any(r.get("id") == gov_req_id for r in data_list_gov)
    record("GOV_WORKFLOW", "Admin Review Government Requests", list_ok,
           f"HTTP {code_list_gov}, found pending request in admin queue")

    # B.7 Administrator Verifies & Provisions Account
    code_decide, data_decide = make_request("PATCH", f"/api/admin/government-requests/{gov_req_id}/decision", {
        "status": "approved",
        "admin_notes": "Verified against AP Revenue Gazette and Direct Confirmation with Collectorate."
    }, token=admin_token)
    decide_ok = code_decide == 200 and data_decide.get("status") == "approved" and bool(data_decide.get("user_id"))
    gov_user_id = data_decide.get("user_id")
    record("GOV_WORKFLOW", "Admin Verifies & Provisions Official", decide_ok,
           f"HTTP {code_decide}, provisioned user_id={gov_user_id}, status='{data_decide.get('status')}'")

    # B.8 Provisioned Government Official Login
    code_gov_log, data_gov_log = make_request("POST", "/api/auth/login", {
        "email": gov_email,
        "password": gov_pass
    })
    gov_token = data_gov_log.get("access_token")
    gov_role = data_gov_log.get("user", {}).get("role")
    gov_status = data_gov_log.get("user", {}).get("status")
    gov_log_ok = code_gov_log == 200 and gov_role == "government_official" and gov_status == "active" and bool(gov_token)
    record("GOV_WORKFLOW", "Provisioned Official Secure Login", gov_log_ok,
           f"HTTP {code_gov_log}, role='{gov_role}', status='{gov_status}', token_present={bool(gov_token)}")

    # B.9 Official Reaches Government Authorized Operations
    code_gov_ops, data_gov_ops = make_request("GET", "/api/admin/stats", token=gov_token)
    record("GOV_WORKFLOW", "Official Access to Government Operations", code_gov_ops == 200,
           f"HTTP {code_gov_ops}, stats retrieved successfully")

    # B.10 Official Cannot Access Admin Management (Role Isolation)
    code_gov_adm_deny, _ = make_request("GET", "/api/admin/users", token=gov_token)
    record("GOV_SECURITY", "Official Role Isolation (Admin Denied)", code_gov_adm_deny == 403,
           f"HTTP {code_gov_adm_deny} (Expected 403 Forbidden)")

    # -------------------------------------------------------------------------
    # PART C: Regression Tests (Citizen & Admin Core)
    # -------------------------------------------------------------------------
    cit_email = f"citizen.reg.{ts}@example.com"
    cit_pass = "CitizenPass2026!"
    code_cit_reg, data_cit_reg = make_request("POST", "/api/auth/register", {
        "full_name": "Lakshmi Narayana",
        "email": cit_email,
        "phone": "9848011223",
        "password": cit_pass,
        "role": "citizen",
        "district": "Nellore"
    })
    code_cit_log, data_cit_log = make_request("POST", "/api/auth/login", {
        "email": cit_email,
        "password": cit_pass
    })
    cit_role = data_cit_log.get("user", {}).get("role")
    cit_ok = code_cit_reg == 201 and code_cit_log == 200 and cit_role == "citizen"
    record("REGRESSION", "Citizen Registration & Login Unaffected", cit_ok,
           f"Reg HTTP {code_cit_reg}, Login HTTP {code_cit_log}, role='{cit_role}'")

    print("\n================================================================================")
    total = len(results)
    passed_count = sum(1 for r in results if r[2])
    failed_count = sum(1 for r in results if not r[2])
    print(f" TOTAL TESTS: {total} | PASSED: {passed_count} | FAILED: {failed_count}")
    print("================================================================================")
    return failed_count == 0

if __name__ == "__main__":
    success = run_suite()
    sys.exit(0 if success else 1)
