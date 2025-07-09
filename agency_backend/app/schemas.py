from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, validator

class UserBase(BaseModel):
    login: str
    name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    login: Optional[str] = None
    name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    project: Optional[str] = None
    deadline: Optional[datetime] = None
    task_type: Optional[str] = None
    task_format: Optional[str] = None
    high_priority: Optional[bool] = False

class TaskCreate(TaskBase):
    executor_id: Optional[int] = None

class Task(TaskBase):
    id: int
    status: str
    executor_id: Optional[int]
    author_id: Optional[int]
    created_at: datetime
    finished_at: Optional[datetime] = None
    high_priority: bool = False

    class Config:
        orm_mode = True


class OperatorBase(BaseModel):
    name: str
    role: str
    color: Optional[str] = None


class OperatorCreate(OperatorBase):
    pass


class Operator(OperatorBase):
    id: int

    class Config:
        orm_mode = True


class Project(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True


class ProjectCreate(BaseModel):
    name: str


class ShootingBase(BaseModel):
    title: str
    project: Optional[str] = None
    quantity: Optional[int] = None
    operator_id: int
    managers: Optional[List[int]] = None
    datetime: datetime


class ShootingCreate(ShootingBase):
    pass


class Shooting(ShootingBase):
    id: int

    @validator('managers', pre=True)
    def parse_managers(cls, v):
        if isinstance(v, str):
            if not v:
                return []
            return [int(x) for x in v.split(',') if x]
        return v

    class Config:
        orm_mode = True
