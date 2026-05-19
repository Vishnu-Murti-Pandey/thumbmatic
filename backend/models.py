from uuid import uuid4
from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

def _uuid() -> str:
    return str(uuid4())

def _now() -> datetime:
    return datetime.now(timezone.utc)

# This class represents a database table.
class Thumbnail(SQLModel, table=True):
    # default_factory -> when ever new object is created, call the _uuid() and use the result of that as default value
    id: str = Field(default_factory=_uuid, primary_key=True)
    
    # A foreign key links one table to another.
    job_id: str = Field(foreign_key='job.id')
    
    # Without default: style_name required, With default: optional during creation
    style_name: str = Field(default="")
    
    # Optional[str] -> Can be:- string, OR- None
    imagekit_url: Optional[str] = Field(default=None)
    
    # New thumbnail starts as: pending
    status: str = Field(default="pending")
    
    # Optional[str] -> Can be:- string, OR- None
    error_message: Optional[str] = Field(default=None)
    
    # Stores creation timestamp.
    created_at: datetime = Field(default_factory=_now)
    
    # Relationship() does NOT create DB columns.
    job: Optional["Job"] = Relationship(back_populates="thumbnails")

class Job(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)
    prompt: str = Field(default="")
    num_thumbnails: int = Field(default=1, ge=1, le=3)
    headshot_url: str = Field(default="")
    status: str = Field(default="pending")
    created_at: datetime = Field(default_factory=_now)
    
    thumbnails: List[Thumbnail] = Relationship(back_populates="job")
    user_id: str = Field(foreign_key="user.id")

class User(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)
    email: str = Field(index=True, unique=True, nullable=False)
    hashed_password: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=_now)
    