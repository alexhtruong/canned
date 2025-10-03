from dotenv import load_dotenv, find_dotenv
import os
from functools import lru_cache

load_dotenv(dotenv_path="default.env", override=False)

load_dotenv(dotenv_path=find_dotenv(".env"), override=True)

class Settings:
    CANVAS_PAT: str | None = os.getenv("CANVAS_PAT")
    CANVAS_BASE_URL: str | None = os.getenv("CANVAS_BASE_URL")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./canned.db")

    def __init__(self):
        if not self.CANVAS_PAT:
            raise ValueError("CANVAS_PAT is missing in the environment variables.")

        if not self.CANVAS_BASE_URL:
            raise ValueError("CANVAS_BASE_URL is missing in the environment variables.")

        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is missing in the environment variables.")

@lru_cache()
def get_settings():
    return Settings()
