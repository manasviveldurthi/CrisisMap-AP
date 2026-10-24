"""
CrisisMap AP - Database Connection Test Script
Run this script from the 'backend' folder to verify your MySQL connection:
    python test_db_connection.py
"""

import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.config import settings
from app.database import test_database_connection


def main():
    print("=" * 60)
    print("CrisisMap AP - MySQL Database Connection Diagnostic")
    print("=" * 60)

    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        print("[!] NOTICE: No '.env' file found in the backend/ directory.")
        print("    Please create backend/.env by copying backend/.env.example:")
        print("        copy .env.example .env")
        print("    Then update DB_USER and DB_PASSWORD with your credentials.\n")

    print(f"Target Host     : {settings.DB_HOST}")
    print(f"Target Port     : {settings.DB_PORT}")
    print(f"Target Database : {settings.DB_NAME}")
    user_status = settings.DB_USER if settings.DB_USER else "[NOT CONFIGURED]"
    print(f"Configured User : {user_status}")
    print("-" * 60)
    print("Testing connection to MySQL...")

    result = test_database_connection()

    if result.get("connected"):
        print("[SUCCESS] MySQL Connection Test PASSED!")
        print(f"          Database '{result.get('database_name')}' is reachable and responding.")
        print("=" * 60)
        sys.exit(0)
    else:
        print("[FAILED]  MySQL Connection Test FAILED.")
        print(f"          Status : {result.get('status')}")
        print(f"          Message: {result.get('message')}")
        if result.get("error_detail"):
            print(f"          Detail : {result.get('error_detail')}")
        print("=" * 60)
        print("Troubleshooting Tips:")
        print("1. Ensure MySQL service is running (e.g. net start MySQL80)")
        print("2. Ensure database 'crisismap_db' exists in MySQL")
        print("3. Check that DB_USER and DB_PASSWORD in backend/.env are accurate")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
