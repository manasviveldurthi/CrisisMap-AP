import logging
from typing import Dict, Any, Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from app.config import settings

logger = logging.getLogger("crisismap.database")

Base = declarative_base()

# Lazy / safe engine creation to avoid crashes if .env is not yet populated
_engine = None
_SessionLocal = None



def get_engine():
    """
    Returns an existing SQLAlchemy engine or creates a new one
    using the configured settings.
    """
    global _engine, _SessionLocal

    if _engine is None:
        if not settings.is_db_configured:
            logger.warning(
                "Database credentials not fully set in .env; engine not initialized."
            )
            return None

        connect_args = {"ssl": {}} if settings.DB_SSL else {}

        _engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            pool_size=10,
            max_overflow=20,
            echo=False,
            connect_args=connect_args
        )

        _SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=_engine
        )

    return _engine



def init_db():
    """
    Creates all application database tables if they do not already exist.
    Safe and idempotent - does not drop or delete existing data.
    """
    engine = get_engine()
    if engine is not None:
        from app import models  # Ensure all model classes are imported
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema tables created or verified.")


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a transactional database session per request.
    Yields session and closes it on exit.
    """
    engine = get_engine()
    if engine is None or _SessionLocal is None:
        raise RuntimeError("Database engine is not configured. Please check your .env settings.")

    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_database_connection() -> Dict[str, Any]:
    """
    Tests connectivity to the MySQL database without exposing credentials.
    Returns a dictionary summarizing connection status.
    """
    if not settings.is_db_configured:
        return {
            "connected": False,
            "status": "unconfigured",
            "database_name": settings.DB_NAME,
            "host": settings.DB_HOST,
            "port": settings.DB_PORT,
            "message": (
                "Database credentials are not yet configured in .env. "
                "Please configure DB_USER and DB_PASSWORD to enable MySQL access."
            )
        }

    try:
        engine = get_engine()
        if engine is None:
            return {
                "connected": False,
                "status": "failed_engine",
                "database_name": settings.DB_NAME,
                "host": settings.DB_HOST,
                "port": settings.DB_PORT,
                "message": "Could not instantiate SQLAlchemy engine."
            }

        # Execute lightweight ping query
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            scalar_value = result.scalar()

        if scalar_value == 1:
            return {
                "connected": True,
                "status": "healthy",
                "database_name": settings.DB_NAME,
                "host": settings.DB_HOST,
                "port": settings.DB_PORT,
                "message": "Successfully connected to MySQL database."
            }
        else:
            return {
                "connected": False,
                "status": "unexpected_result",
                "database_name": settings.DB_NAME,
                "host": settings.DB_HOST,
                "port": settings.DB_PORT,
                "message": "Query executed but returned an unexpected verification scalar."
            }

    except OperationalError as oe:
        # Sanitize error to avoid credential leakage
        raw_msg = str(oe.orig) if hasattr(oe, "orig") else str(oe)
        logger.error(f"MySQL connection operational error: {raw_msg}")
        return {
            "connected": False,
            "status": "connection_failed",
            "database_name": settings.DB_NAME,
            "host": settings.DB_HOST,
            "port": settings.DB_PORT,
            "message": "Failed to connect to MySQL server. Verify credentials, port, and that MySQL service is running.",
            "error_detail": raw_msg
        }
    except SQLAlchemyError as se:
        logger.error(f"SQLAlchemy database error: {str(se)}")
        return {
            "connected": False,
            "status": "sqlalchemy_error",
            "database_name": settings.DB_NAME,
            "host": settings.DB_HOST,
            "port": settings.DB_PORT,
            "message": "Database query error occurred during connection test.",
            "error_detail": str(se)
        }
    except Exception as exc:
        logger.error(f"Unexpected connection test error: {str(exc)}")
        return {
            "connected": False,
            "status": "unexpected_error",
            "database_name": settings.DB_NAME,
            "host": settings.DB_HOST,
            "port": settings.DB_PORT,
            "message": "Unexpected error while attempting MySQL connection.",
            "error_detail": str(exc)
        }
