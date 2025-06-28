from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from . import models, schemas, auth


def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_name(db: Session, name: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.name == name).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(name=user.name, hashed_password=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_users(db: Session) -> List[models.User]:
    return db.query(models.User).all()


def update_user(db: Session, user_id: int, user: schemas.UserUpdate) -> Optional[models.User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    if user.name is not None:
        db_user.name = user.name
    if user.password is not None:
        db_user.hashed_password = auth.get_password_hash(user.password)
    if user.role is not None:
        db_user.role = user.role
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int) -> None:
    user = get_user(db, user_id)
    if user:
        db.delete(user)
        db.commit()


def get_operators(db: Session) -> List[models.Operator]:
    return db.query(models.Operator).all()


def create_operator(db: Session, operator: schemas.OperatorCreate) -> models.Operator:
    op = models.Operator(name=operator.name, role=operator.role)
    db.add(op)
    db.commit()
    db.refresh(op)
    return op


def update_operator(db: Session, operator_id: int, operator: schemas.OperatorCreate) -> Optional[models.Operator]:
    op = db.query(models.Operator).filter(models.Operator.id == operator_id).first()
    if not op:
        return None
    op.name = operator.name
    op.role = operator.role
    db.commit()
    db.refresh(op)
    return op


def delete_operator(db: Session, operator_id: int) -> None:
    op = db.query(models.Operator).filter(models.Operator.id == operator_id).first()
    if op:
        db.delete(op)
        db.commit()


def get_tasks(db: Session, skip: int = 0, limit: int = 100) -> List[models.Task]:
    return db.query(models.Task).offset(skip).limit(limit).all()


def create_task(db: Session, task: schemas.TaskCreate, author_id: int) -> models.Task:
    db_task = models.Task(
        title=task.title,
        description=task.description,
        project=task.project,
        deadline=task.deadline,
        executor_id=task.executor_id,
        author_id=author_id,
        task_type=task.task_type,
        task_format=task.task_format,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(db: Session, task_id: int, data: schemas.TaskCreate) -> Optional[models.Task]:
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        return None
    task.title = data.title
    task.description = data.description
    task.project = data.project
    task.deadline = data.deadline
    task.executor_id = data.executor_id
    task.task_type = data.task_type
    task.task_format = data.task_format
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int) -> None:
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if task:
        db.delete(task)
        db.commit()


def update_task_status(db: Session, task_id: int, status: str):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if task:
        task.status = status
        db.commit()
        db.refresh(task)
    return task
