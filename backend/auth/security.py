import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt
from config import JWT_SECRET_KEY 

ALGORITHM="HS256"

def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(12)
    hashed_password = bcrypt.hashpw(password_bytes, salt)
    return hashed_password.decode("utf-8")

def verify_password(user_password: str, hashed_password: str) -> bool:
    user_password_bytes = user_password.encode('utf-8')
    is_correct = bcrypt.checkpw(user_password_bytes, hashed_password.encode("utf-8"));
    return is_correct

def create_access_token(user_id: str, email: str, expiry: int = 60) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expiry)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire
    }
    
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return token

def decode_access_token(token: str):
    payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=ALGORITHM)
    return payload
    