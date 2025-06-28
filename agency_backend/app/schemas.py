from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class UserBase(BaseModel):
    name: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    project: Optional[str] = None
    deadline: Optional[datetime] = None

class TaskCreate(TaskBase):
    executor_id: Optional[int] = None

class Task(TaskBase):
    id: int
    status: str
    executor_id: Optional[int]
    author_id: Optional[int]

    class Config:
        orm_mode = True
