from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Get sensitive keys from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256") 
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 150))
DATABASE_URL = os.getenv("DATABASE_URL")


