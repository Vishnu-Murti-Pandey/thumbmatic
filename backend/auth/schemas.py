from pydantic import BaseModel

class RegisterRequest(BaseModel):
    email: str
    password: str
    
class LoginRequest(BaseModel):
    email: str
    password: str
    
class RegisterResponse(BaseModel):
    message: str
    
class LoginResponse(BaseModel):
    message: str
    access_token: str
    
class UserProfileResponse(BaseModel):
    user_id: str
    email: str