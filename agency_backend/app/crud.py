from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from . import models, schemas, auth


def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_login(db: Session, login: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.login == login).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        login=user.login,
        name=user.name,
        hashed_password=hashed_password,
        role=user.role,
    )
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
    if user.login is not None:
        db_user.login = user.login
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
    op = models.Operator(name=operator.name, role=operator.role, color=operator.color or "#ff0000")
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
    if operator.color is not None:
        op.color = operator.color
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


def get_tasks_for_user(db: Session, user: models.User, skip: int = 0, limit: int = 100) -> List[models.Task]:
    q = db.query(models.Task).join(models.User, models.Task.executor_id == models.User.id)
    if user.role == models.RoleEnum.admin:
        pass
    elif user.role == models.RoleEnum.head_smm:
        q = q.filter(
            models.User.role.in_(
                [
                    models.RoleEnum.designer,
                    models.RoleEnum.smm_manager,
                    models.RoleEnum.head_smm,
                ]
            )
        )
    elif user.role == models.RoleEnum.smm_manager:
        q = q.filter(
            models.User.role.in_(
                [models.RoleEnum.designer, models.RoleEnum.smm_manager]
            )
        )
    elif user.role == models.RoleEnum.designer:
        q = q.filter(models.User.role == models.RoleEnum.designer)
    return q.offset(skip).limit(limit).all()


def create_task(db: Session, task: schemas.TaskCreate, author_id: int) -> models.Task:
    deadline = task.deadline
    db_task = models.Task(
        title=task.title,
        description=task.description,
        project=task.project,
        deadline=deadline,
        executor_id=task.executor_id,
        author_id=author_id,
        task_type=task.task_type,
        task_format=task.task_format,
        high_priority=task.high_priority or False,
        created_at=datetime.utcnow(),
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(db: Session, task_id: int, data: schemas.TaskCreate) -> Optional[models.Task]:
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        return None
    deadline = data.deadline
    task.title = data.title
    task.description = data.description
    task.project = data.project
    task.deadline = deadline
    task.executor_id = data.executor_id
    task.task_type = data.task_type
    task.task_format = data.task_format
    if data.high_priority is not None:
        task.high_priority = data.high_priority
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
        if status == models.TaskStatus.done:
            task.finished_at = datetime.utcnow()
        else:
            task.finished_at = None
        db.commit()
        db.refresh(task)
    return task


def get_projects(db: Session) -> List[models.Project]:
    return db.query(models.Project).all()


def create_project(db: Session, name: str) -> models.Project:
    project = models.Project(name=name)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int) -> None:
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if proj:
        db.delete(proj)
        db.commit()


def update_project(db: Session, project_id: int, name: str) -> Optional[models.Project]:
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        return None
    proj.name = name
    db.commit()
    db.refresh(proj)
    return proj


def get_shootings(db: Session) -> List[models.Shooting]:
    return db.query(models.Shooting).all()


def create_shooting(db: Session, shooting: schemas.ShootingCreate) -> models.Shooting:
    mlist = ','.join(map(str, shooting.managers or []))
    sh = models.Shooting(
        title=shooting.title,
        project=shooting.project,
        quantity=shooting.quantity,
        operator_id=shooting.operator_id,
        managers=mlist,
        datetime=shooting.datetime,
        end_datetime=shooting.end_datetime,
    )
    db.add(sh)
    db.commit()
    db.refresh(sh)
    return sh


def update_shooting(db: Session, sid: int, shooting: schemas.ShootingCreate) -> Optional[models.Shooting]:
    sh = db.query(models.Shooting).filter(models.Shooting.id == sid).first()
    if not sh:
        return None
    sh.title = shooting.title
    sh.project = shooting.project
    sh.quantity = shooting.quantity
    sh.operator_id = shooting.operator_id
    sh.managers = ','.join(map(str, shooting.managers or []))
    sh.datetime = shooting.datetime
    sh.end_datetime = shooting.end_datetime
    db.commit()
    db.refresh(sh)
    return sh


def delete_shooting(db: Session, sid: int) -> None:
    sh = db.query(models.Shooting).filter(models.Shooting.id == sid).first()
    if sh:
        db.delete(sh)
        db.commit()

def complete_shooting(
    db: Session,
    sid: int,
    quantity: int,
    managers: Optional[List[int]] = None,
    operators: Optional[List[int]] = None,
) -> Optional[models.Shooting]:
    sh = db.query(models.Shooting).filter(models.Shooting.id == sid).first()
    if not sh:
        return None
    sh.completed = True
    sh.completed_quantity = quantity
    sh.completed_managers = ','.join(map(str, managers or []))
    sh.completed_operators = ','.join(map(str, operators or []))
    db.commit()
    db.refresh(sh)
    return sh
