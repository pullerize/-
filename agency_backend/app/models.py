from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .database import Base

class RoleEnum(str, enum.Enum):
    designer = "designer"
    smm_manager = "smm_manager"
    head_smm = "head_smm"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    hashed_password = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.designer)

    # Tasks assigned to the user
    tasks = relationship(
        "Task",
        foreign_keys="Task.executor_id",
        back_populates="executor",
    )

    # Tasks created by the user
    authored_tasks = relationship(
        "Task",
        foreign_keys="Task.author_id",
        back_populates="author",
    )

class TaskStatus(str, enum.Enum):
    in_progress = "in_progress"
    done = "done"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    project = Column(String, index=True)
    deadline = Column(DateTime)
    status = Column(Enum(TaskStatus), default=TaskStatus.in_progress)
    task_type = Column(String, nullable=True)
    task_format = Column(String, nullable=True)
    high_priority = Column(Boolean, default=False)
    executor_id = Column(Integer, ForeignKey("users.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)

    executor = relationship(
        "User",
        foreign_keys=[executor_id],
        back_populates="tasks",
    )
    author = relationship(
        "User",
        foreign_keys=[author_id],
        back_populates="authored_tasks",
    )


class OperatorRole(str, enum.Enum):
    mobile = "mobile"
    video = "video"


class Operator(Base):
    __tablename__ = "operators"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    role = Column(Enum(OperatorRole))


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
