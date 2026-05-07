from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.schemas import UserCreate, UserLogin, UserResponse, UserTokenResponse
from app.services import auth_service
from app.database.db import get_db
import traceback

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(data: UserCreate, db: Session = Depends(get_db)):
    try:
        user = auth_service.create_user(db, data)
        if not user:
            raise HTTPException(status_code=400, detail="Email already registered")
        return user
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=UserTokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    try:
        result = auth_service.login_user(db, data.email, data.password)
        if not result:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return result
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))