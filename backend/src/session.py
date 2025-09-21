import requests 
from src.config import get_settings

# Initialize env variables
settings = get_settings()

session = requests.Session()
session.headers.update({
    "Authorization": f"Bearer {settings.CANVAS_PAT}",
    "Content-Type": "application/json",
})