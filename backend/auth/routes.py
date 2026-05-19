from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from models import User
from auth.schemas import RegisterRequest, LoginRequest, RegisterResponse, LoginResponse, UserProfileResponse
from auth.security import hash_password, verify_password, create_access_token
from auth.dependencies import get_current_user
from database import get_session

auth_router = APIRouter(prefix='/api/auth', tags=["Authentication"])

@auth_router.post('/register', response_model=RegisterResponse)
def register(request: RegisterRequest, session: Session = Depends(get_session)):
    user_email = request.email
    user_password = request.password
    
    user = session.exec(select(User).where(User.email == user_email)).first()
    
    if(user):
        raise HTTPException(status_code=400, detail="Email already exist.")
    
    hashed_password = hash_password(user_password)
    user = User(email=user_email, hashed_password=hashed_password)
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return RegisterResponse(message="User created successfully")

@auth_router.post('/login', response_model=LoginResponse)
def login(request: LoginRequest, session: Session = Depends(get_session)):
    user_email = request.email
    user_password = request.password
    
    user = session.exec(select(User).where(User.email == user_email)).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User doesn't exist.")
    
    is_password_matched = verify_password(user_password, user.hashed_password)
    if is_password_matched == False:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    
    jwt_token = create_access_token(user.id, user.email, 60)
    
    return LoginResponse(message="Login successful", access_token=jwt_token)

@auth_router.get("/user_profile", response_model= UserProfileResponse)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    return UserProfileResponse(user_id=current_user.id, email=current_user.email)
 