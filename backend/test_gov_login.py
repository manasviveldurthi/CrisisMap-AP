import json
import urllib.request

def test_government_login():
    print("=" * 65)
    print("Testing Government Official Authentication & Authorization Flow")
    print("=" * 65)

    # 1. Test login with newly provisioned account
    payload = json.dumps({
        "email": "official@ap.gov.in",
        "password": "GovtOfficialPass123!"
    }).encode("utf-8")
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/auth/login",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as res:
        assert res.status == 200, f"Expected 200, got {res.status}"
        data = json.loads(res.read().decode("utf-8"))
        token = data["access_token"]
        user = data["user"]
        print(f"[TEST 1] Login as '{user['email']}': PASS (Role: {user['role']}, Status: {user['status']})")
        assert user["role"] == "government_official"
        assert user["status"] == "active"

    # 2. Test accessing protected Government routes (/api/admin/stats allows government officials)
    stats_req = urllib.request.Request(
        "http://127.0.0.1:8000/api/admin/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(stats_req) as s_res:
        assert s_res.status == 200
        stats = json.loads(s_res.read().decode("utf-8"))
        print(f"[TEST 2] Accessing /api/admin/stats: PASS (Total Requests in DB: {stats['total_requests']})")

    # 3. Test that government official is forbidden from admin user management (/api/admin/users)
    users_req = urllib.request.Request(
        "http://127.0.0.1:8000/api/admin/users",
        headers={"Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(users_req) as u_res:
            assert False, "Expected 403 Forbidden for non-admin accessing /api/admin/users"
    except urllib.error.HTTPError as he:
        assert he.code == 403
        print(f"[TEST 3] Government access to admin-only /api/admin/users: PASS (403 Forbidden as expected)")

    # 4. Test login with admin@crisismap.org
    adm_payload = json.dumps({
        "email": "admin@crisismap.org",
        "password": "AdminPass123!"
    }).encode("utf-8")
    adm_req = urllib.request.Request(
        "http://127.0.0.1:8000/api/auth/login",
        data=adm_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(adm_req) as adm_res:
        assert adm_res.status == 200
        adm_data = json.loads(adm_res.read().decode("utf-8"))
        adm_user = adm_data["user"]
        print(f"[TEST 4] Login as '{adm_user['email']}': PASS (Role: {adm_user['role']})")
        assert adm_user["role"] == "admin"

    # 5. Test wrong password rejection
    bad_payload = json.dumps({
        "email": "official@ap.gov.in",
        "password": "WrongPassword123"
    }).encode("utf-8")
    bad_req = urllib.request.Request(
        "http://127.0.0.1:8000/api/auth/login",
        data=bad_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(bad_req) as bad_res:
            assert False, "Expected 401 Unauthorized for incorrect password"
    except urllib.error.HTTPError as he:
        assert he.code == 401
        print("[TEST 5] Wrong password rejection: PASS (401 Unauthorized)")

    print("=" * 65)
    print("ALL GOVERNMENT OFFICIAL AUTHENTICATION TESTS PASSED 100%!")
    print("=" * 65)

if __name__ == "__main__":
    test_government_login()
