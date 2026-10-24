import argparse
import sys
from pathlib import Path

# Ensure backend root is always present in sys.path whether executed directly or as a module
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.database import get_db, init_db
from app import models, auth


def provision_account(
    email: str,
    password: str,
    role: str = "government_official",
    full_name: str = None,
    phone: str = "1070",
    district: str = "AP Disaster Management Command",
    update_existing: bool = False
):
    """
    Controlled provisioning procedure for administrator and government official accounts.
    - Securely hashes passwords with bcrypt (12 salt rounds).
    - Refuses to overwrite or elevate existing unrelated accounts (e.g. citizens/responders).
    - Requires explicit update authorization to update an existing privileged account.
    - Never prints secrets.
    """
    init_db()

    clean_email = email.lower().strip()
    clean_role = role.strip()
    if clean_role not in ["admin", "government_official", "official"]:
        print(f"[ERROR] Invalid role '{clean_role}'. Provisioning only permits 'admin' or 'government_official'.")
        sys.exit(1)

    if len(password) < 6:
        print("[ERROR] Password must be at least 6 characters.")
        sys.exit(1)

    db_gen = get_db()
    db = next(db_gen)
    try:
        existing = db.query(models.User).filter(models.User.email == clean_email).first()
        if existing:
            # Task 4 & Task 5: Refuse to grant admin or government privileges to an unrelated user or overwrite without explicit flag
            if existing.role not in ["admin", "government_official", "official"]:
                print(f"[ERROR] Refusing operation: An account with email '{clean_email}' already exists with role '{existing.role}'.")
                print("        Existing citizen or responder accounts cannot be elevated to privileged roles.")
                sys.exit(1)

            if not update_existing:
                print(f"[NOTICE] Account '{clean_email}' already exists with role '{existing.role}' (Status: {existing.status.upper()}).")
                print("         To update its credentials, run with --update, or use the 'reset-password' command.")
                return

            # Explicit update
            existing.password_hash = auth.hash_password(password)
            existing.role = clean_role
            existing.status = "active"
            if full_name:
                existing.full_name = full_name.strip()
            if phone:
                existing.phone = phone.strip()
            if district:
                existing.district = district.strip()
            db.commit()
            print(f"[SUCCESS] Existing {clean_role.upper()} account '{clean_email}' credentials updated successfully (Status: ACTIVE).")
            return

        # Create new provisioned account
        default_name = "State Disaster Operations Administrator" if clean_role == "admin" else "District Disaster Management Officer"
        default_title = "State Operations Coordinator" if clean_role == "admin" else "District Emergency Operations Commander"

        hashed_pw = auth.hash_password(password)
        user_account = models.User(
            email=clean_email,
            password_hash=hashed_pw,
            full_name=full_name.strip() if full_name else default_name,
            phone=phone.strip() if phone else "1070",
            role=clean_role,
            status="active",
            district=district.strip() if district else "AP State Disaster Management Authority",
            title_or_designation=default_title
        )
        db.add(user_account)
        db.commit()
        print(f"[SUCCESS] New {clean_role.upper()} account provisioned successfully: {clean_email} (Status: ACTIVE)")
    finally:
        db.close()


def create_admin(
    email: str,
    password: str,
    full_name: str = "Disaster Operations Admin",
    phone: str = "1070",
    district: str = "AP State Disaster Management Authority",
    role: str = "admin",
    update_existing: bool = False
):
    """Backward-compatible wrapper for administrator provisioning."""
    provision_account(
        email=email,
        password=password,
        role=role,
        full_name=full_name,
        phone=phone,
        district=district,
        update_existing=update_existing
    )


def reset_password(email: str, password: str):
    """
    Securely resets the password for an existing account.
    """
    init_db()

    db_gen = get_db()
    db = next(db_gen)
    try:
        clean_email = email.lower().strip()
        user = db.query(models.User).filter(models.User.email == clean_email).first()
        if not user:
            print(f"[ERROR] Account with email '{clean_email}' was not found in MySQL crisismap_db.")
            sys.exit(1)

        user.password_hash = auth.hash_password(password)
        user.status = "active"
        db.commit()
        print(f"[SUCCESS] Password for user '{clean_email}' (Role: {user.role}) has been reset successfully.")
    finally:
        db.close()


def list_admins():
    """
    Lists existing administrator and government accounts without exposing passwords or hashes.
    """
    init_db()

    db_gen = get_db()
    db = next(db_gen)
    try:
        officials = db.query(models.User).filter(
            models.User.role.in_(["admin", "government_official", "official"])
        ).all()
        print("=" * 70)
        print("CrisisMap AP - Provisioned Government Official / Admin Accounts")
        print("=" * 70)
        if not officials:
            print("[INFO] No administrative or government accounts found in database.")
        for idx, adm in enumerate(officials, 1):
            print(f"[{idx}] Email : {adm.email}")
            print(f"    Name  : {adm.full_name}")
            print(f"    Role  : {adm.role.upper()} | Status: {adm.status.upper()}")
            print(f"    Dept  : {adm.district or 'State Operations'}")
            print(f"    Title : {adm.title_or_designation or 'Coordinator'}")
            print("-" * 70)
    finally:
        db.close()

import getpass

def prompt_password(prompt: str = "Enter Password: ") -> str:
    """Interactively collect password without echo using getpass, with safe fallback."""
    if sys.stdin.isatty():
        return getpass.getpass(prompt).strip()
    return sys.stdin.readline().strip()


def main():
    parser = argparse.ArgumentParser(description="CrisisMap AP Administrative CLI")
    subparsers = parser.add_subparsers(dest="command")

    # init-db command
    subparsers.add_parser("init-db", help="Create all database tables in MySQL without sample data")

    # list-admins command
    subparsers.add_parser("list-admins", help="List provisioned administrator and government accounts")

    # provision-admin command (Task 4 bootstrap procedure)
    admin_prov_parser = subparsers.add_parser("provision-admin", help="Bootstrap or provision an authorized State Administrator account")
    admin_prov_parser.add_argument("--email", default=None, help="Administrator email address (interactive if omitted)")
    admin_prov_parser.add_argument("--password", default=None, help="Secure password for administrator (interactive if omitted)")
    admin_prov_parser.add_argument("--name", default="State Disaster Operations Administrator", help="Full name")
    admin_prov_parser.add_argument("--phone", default="1070", help="Contact phone")
    admin_prov_parser.add_argument("--district", default="AP State Disaster Management Authority", help="Assigned division")
    admin_prov_parser.add_argument("--update", action="store_true", help="Explicitly authorize updating an existing admin account")

    # create-admin command (backward-compatible alias)
    admin_parser = subparsers.add_parser("create-admin", help="Alias for provision-admin")
    admin_parser.add_argument("--email", default=None, help="Administrator email address")
    admin_parser.add_argument("--password", default=None, help="Secure password for administrator")
    admin_parser.add_argument("--name", default="State Disaster Operations Administrator", help="Full name")
    admin_parser.add_argument("--phone", default="1070", help="Contact phone")
    admin_parser.add_argument("--district", default="AP State Disaster Management Authority", help="Assigned division")
    admin_parser.add_argument("--role", default="admin", choices=["admin", "government_official"], help="Role to assign")
    admin_parser.add_argument("--update", action="store_true", help="Explicitly authorize updating an existing account")

    # provision-government command (Task 3 provisioning procedure)
    gov_parser = subparsers.add_parser("provision-government", help="Provision a verified Government Official account")
    gov_parser.add_argument("--email", default=None, help="Government official email address (interactive if omitted)")
    gov_parser.add_argument("--password", default=None, help="Secure password (interactive if omitted)")
    gov_parser.add_argument("--name", default="District Disaster Management Officer", help="Full name")
    gov_parser.add_argument("--phone", default="1070", help="Contact phone")
    gov_parser.add_argument("--district", default="AP Disaster Response Center", help="Assigned district")
    gov_parser.add_argument("--update", action="store_true", help="Explicitly authorize updating an existing account")

    # reset-password command
    reset_parser = subparsers.add_parser("reset-password", help="Reset password for an existing account")
    reset_parser.add_argument("--email", default=None, help="Account email address (interactive if omitted)")
    reset_parser.add_argument("--password", default=None, help="New secure password (interactive if omitted)")

    args = parser.parse_args()

    if args.command == "init-db":
        print("[INFO] Creating database schema in MySQL crisismap_db...")
        init_db()
        print("[SUCCESS] Database tables verified / created.")
    elif args.command == "list-admins":
        list_admins()
    elif args.command == "provision-admin":
        email = args.email or input("Enter Administrator Email: ").strip()
        if not email:
            print("[ERROR] Email is required.")
            sys.exit(1)
        password = args.password or prompt_password("Enter Administrator Password (min 6 chars): ")
        if len(password) < 6:
            print("[ERROR] Password must be at least 6 characters.")
            sys.exit(1)
        name = args.name
        if not args.email and name == "State Disaster Operations Administrator":
            prompt_name = input(f"Enter Full Name [{name}]: ").strip()
            if prompt_name:
                name = prompt_name
        provision_account(
            email=email,
            password=password,
            role="admin",
            full_name=name,
            phone=args.phone,
            district=args.district,
            update_existing=args.update
        )
    elif args.command == "create-admin":
        email = args.email or input("Enter Administrator Email: ").strip()
        if not email:
            print("[ERROR] Email is required.")
            sys.exit(1)
        password = args.password or prompt_password("Enter Administrator Password (min 6 chars): ")
        if len(password) < 6:
            print("[ERROR] Password must be at least 6 characters.")
            sys.exit(1)
        provision_account(
            email=email,
            password=password,
            role=getattr(args, "role", "admin"),
            full_name=args.name,
            phone=args.phone,
            district=args.district,
            update_existing=args.update
        )
    elif args.command == "provision-government":
        email = args.email or input("Enter Government Official Email: ").strip()
        if not email:
            print("[ERROR] Email is required.")
            sys.exit(1)
        password = args.password or prompt_password("Enter Government Official Password (min 6 chars): ")
        if len(password) < 6:
            print("[ERROR] Password must be at least 6 characters.")
            sys.exit(1)
        name = args.name
        if not args.email and name == "District Disaster Management Officer":
            prompt_name = input(f"Enter Full Name [{name}]: ").strip()
            if prompt_name:
                name = prompt_name
        provision_account(
            email=email,
            password=password,
            role="government_official",
            full_name=name,
            phone=args.phone,
            district=args.district,
            update_existing=args.update
        )
    elif args.command == "reset-password":
        email = args.email or input("Enter Account Email: ").strip()
        if not email:
            print("[ERROR] Email is required.")
            sys.exit(1)
        password = args.password or prompt_password("Enter New Password (min 6 chars): ")
        if len(password) < 6:
            print("[ERROR] Password must be at least 6 characters.")
            sys.exit(1)
        reset_password(
            email=email,
            password=password
        )
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
