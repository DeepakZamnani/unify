from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import get_current_user, get_db
from app.api.v1.schemas import Token, UserCreate, UserLogin, UserRead
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User


router = APIRouter(tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    existing_user = db.exec(select(User).where(User.email == payload.email)).one_or_none()
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(email=payload.email, password_hash=hash_password(payload.password), role=payload.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
def login_user(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = db.exec(select(User).where(User.email == payload.email)).one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    access_token = create_access_token({"sub": str(user.id), "role": user.role.value, "email": user.email})
    return Token(access_token=access_token)


@router.get("/me", response_model=UserRead, status_code=status.HTTP_200_OK)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user
