import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import health

# Configure standard logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("crisismap.main")

from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import health, auth, requests, admin, shelters

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables safely on application startup
    logger.info("Initializing database schema on startup...")
    try:
        init_db()
    except Exception as e:
        logger.error(f"Error initializing database schema: {e}")
    yield

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Middleware for Chromium Private Network Access (PNA) preflight support
@app.middleware("http")
async def add_private_network_headers(request, call_next):
    response = await call_next(request)
    if request.headers.get("access-control-request-private-network"):
        response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

# Configure Cross-Origin Resource Sharing (CORS) for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(requests.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(shelters.router, prefix="/api")


@app.get("/", tags=["Root"])
def root():
    """
    Root API discovery endpoint.
    """
    return {
        "app": settings.API_TITLE,
        "version": settings.API_VERSION,
        "status": "online",
        "documentation": "/docs",
        "endpoints": {
            "health": "/health",
            "database_health": "/health/db"
        }
    }


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting {settings.API_TITLE} on {settings.SERVER_HOST}:{settings.SERVER_PORT}")
    uvicorn.run(
        "app.main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=(settings.ENVIRONMENT == "development")
    )
