from sqlalchemy import create_engine
from src.config import get_settings

settings = get_settings()
connection_url = settings.DATABASE_URL

print(f"Database URL: {connection_url}")

# Minimal SQLite engine - just what you need for your current usage
if connection_url.startswith("sqlite"):
    engine = create_engine(
        connection_url,
        connect_args={"check_same_thread": False}  # Only needed for FastAPI threading
    )
else:
    # Keep it simple - just support SQLite for now
    engine = create_engine(connection_url)
