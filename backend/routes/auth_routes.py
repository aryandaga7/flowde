from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.models import User
from pydantic import BaseModel
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
from typing import Optional
from core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from auth.auth_dependencies import get_current_user
from fastapi import Form
from google.oauth2 import id_token
from google.auth.transport import requests
import os
from dotenv import load_dotenv

load_dotenv()
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
router = APIRouter()

# Secret key and algorithm for JWT; in production, use a secure key and configuration.
SECRET_KEY = SECRET_KEY
ALGORITHM = ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_EXPIRE_MINUTES

# Password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic models for requests and responses.
class UserCreate(BaseModel):
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Dependency to get DB session.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Utility functions for password hashing and verification.
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Signup endpoint
@router.post("/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
    email=user.email,
    password_hash=hashed_password,
    first_name=user.first_name,
    last_name=user.last_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# Login endpoint
@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name
    }

@router.post("/google-login", response_model=Token)
async def google_login(token: str = Form(...), db: Session = Depends(get_db)):
    try:
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        
        # Extract user information from the token
        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email not found in Google token")
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        # If user doesn't exist, create a new one
        if not user:
            new_user = User(
                email=email,
                password_hash=None,  # No password for Google auth users
                first_name=idinfo.get("given_name", ""),
                last_name=idinfo.get("family_name", "")
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
        
        # Generate access token
        access_token = create_access_token(data={"sub": email})
        return {"access_token": access_token, "token_type": "bearer"}
    
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

# Add forgot password endpoint (simplified version)
@router.post("/forgot-password")
async def forgot_password(email: str = Form(...), db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Don't reveal if email exists for security
        return {"message": "If your email is registered, you will receive a password reset link"}
    
    # In a real implementation, you would:
    # 1. Generate a password reset token
    # 2. Store it in the database with an expiration time
    # 3. Send an email with a link containing the token
    
    # For now, we'll just return a success message
    return {"message": "If your email is registered, you will receive a password reset link"}
