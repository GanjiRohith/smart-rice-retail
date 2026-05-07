from sqlalchemy.orm import Session
from app.database import models
from app.database.schemas import UserCreate
from app.core.security import hash_password, verify_password, create_access_token

def create_user(db: Session, data: UserCreate):
    if db.query(models.User).filter(models.User.email == data.email).first():
        return None
    user = models.User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        phone=data.phone,
        address=data.address
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def login_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    token = create_access_token({
        "sub": user.email,
        "role": user.role,
        "user_id": user.user_id,
        "name": user.name,
    })
    return {"access_token": token, "token_type": "bearer", "role": user.role, "name": user.name, "user_id": user.user_id}