from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import test_database_connection

router = APIRouter(tags=["Health & Diagnostics"])


@router.get("/health", summary="API Service Liveness Check")
def get_api_health():
    """
    Checks if the FastAPI server process is online and responsive.
    Does not require database access.
    """
    return {
        "status": "healthy",
        "service": settings.API_TITLE,
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT
    }


@router.get("/health/db", summary="MySQL Database Connection Check")
def get_database_health():
    """
    Verifies live connectivity to the configured MySQL database without exposing credentials.
    Returns HTTP 200 if connected; HTTP 503 if disconnected or unconfigured.
    """
    db_test = test_database_connection()

    if db_test.get("connected"):
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "healthy",
                "database": "connected",
                "database_name": db_test.get("database_name"),
                "host": db_test.get("host"),
                "port": db_test.get("port"),
                "message": db_test.get("message")
            }
        )
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "database_name": db_test.get("database_name"),
                "host": db_test.get("host"),
                "port": db_test.get("port"),
                "message": db_test.get("message"),
                "error": db_test.get("error_detail")
            }
        )
