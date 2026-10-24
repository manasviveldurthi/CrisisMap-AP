# CrisisMap AP - Backend Setup & Verification Guide

This directory contains the Python FastAPI backend for **CrisisMap AP**, connected to MySQL via SQLAlchemy and PyMySQL.

---

## 1. Prerequisites

- **Python**: 3.10+ (Python 3.12 verified)
- **MySQL Server**: MySQL 8.0 running locally on port 3306
- **Database**: An empty database named `crisismap_db`

---

## 2. Step-by-Step Setup

### Step A: Open Terminal in the `backend` Directory
Open PowerShell or your command prompt and navigate to the backend folder:
```powershell
cd c:\Users\geeth\OneDrive\Desktop\CrisisMap-AP\backend
```

### Step B: Create and Activate a Python Virtual Environment
Creating an isolated virtual environment ensures clean dependency isolation:
```powershell
# Create virtual environment
python -m venv venv

# Activate on Windows PowerShell:
.\venv\Scripts\Activate.ps1

# (If running in standard Windows Command Prompt instead):
# .\venv\Scripts\activate.bat
```

> **Note on PowerShell Script Execution**: If PowerShell restricts script activation, run:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

### Step C: Install Dependencies
Install all required libraries from `requirements.txt`:
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Step D: Configure Environment Variables (`.env`)
Create your local `.env` file by copying `.env.example`:
```powershell
copy .env.example .env
```

Open `.env` in your editor and update with your actual MySQL credentials:
```ini
# Server Settings
SERVER_HOST=127.0.0.1
SERVER_PORT=8000
ENVIRONMENT=development

# MySQL Database Settings
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=crisismap_db

# CORS Allowed Origins (Vite React frontend)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

*(Note: Replace `your_mysql_username` and `your_mysql_password` with your real MySQL credentials, e.g. `root` and your password).*

---

## 3. Verify Database Connection

Before starting the web server, run the built-in diagnostic test to verify your MySQL connection:
```powershell
python test_db_connection.py
```

### Expected Output upon Successful Configuration:
```
============================================================
CrisisMap AP - MySQL Database Connection Diagnostic
============================================================
Target Host     : 127.0.0.1
Target Port     : 3306
Target Database : crisismap_db
Configured User : root
------------------------------------------------------------
Testing connection to MySQL...
[SUCCESS] MySQL Connection Test PASSED!
          Database 'crisismap_db' is reachable and responding.
============================================================
```

---

## 4. Run the FastAPI Server

Once the connection test passes, start the development server:
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be live at:
- **Root Discovery**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **API Liveness**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- **Database Liveness**: [http://127.0.0.1:8000/health/db](http://127.0.0.1:8000/health/db)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
