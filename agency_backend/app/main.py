from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import models, schemas, crud, auth
from .database import engine, Base, SessionLocal


Base.metadata.create_all(bind=engine)


def create_default_admin():
    db = SessionLocal()
    try:
        if not crud.get_user_by_name(db, "admin"):
            admin = schemas.UserCreate(
                name="admin",
                password="admin123",
                role=models.RoleEnum.admin,
            )
            crud.create_user(db, admin)
    finally:
        db.close()


create_default_admin()

app = FastAPI(title="Agency API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(auth.get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user.name})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(auth.get_db), current: models.User = Depends(auth.get_current_active_user)):
    if current.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    db_user = crud.get_user_by_name(db, user.name)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db, user)


@app.get("/users/", response_model=list[schemas.User])
def list_users(db: Session = Depends(auth.get_db), current: models.User = Depends(auth.get_current_active_user)):
    return crud.get_users(db)


@app.get("/users/me", response_model=schemas.User)
def read_current_user(current: models.User = Depends(auth.get_current_active_user)):
    return current


@app.put("/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(auth.get_db), current: models.User = Depends(auth.get_current_active_user)):
    if current.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    updated = crud.update_user(db, user_id, user)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated


@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(auth.get_db), current: models.User = Depends(auth.get_current_active_user)):
    if current.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    crud.delete_user(db, user_id)
    return {"ok": True}


@app.get("/tasks/", response_model=list[schemas.Task])
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(auth.get_db), current: models.User = Depends(auth.get_current_active_user)):
    return crud.get_tasks(db, skip=skip, limit=limit)


@app.post("/tasks/", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(auth.get_db), current: models.User = Depends(auth.get_current_active_user)):
    return crud.create_task(db, task, author_id=current.id)


@app.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task: schemas.TaskCreate, db: Session = Depends(auth.get_db), current: models.User = Depends(auth.get_current_active_user)):
    updated = crud.update_task(db, task_id, task)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(auth.get_db), current: models.User = Depends(auth.get_current_active_user)):
    crud.delete_task(db, task_id)
    return {"ok": True}


@app.patch("/tasks/{task_id}/status", response_model=schemas.Task)
def update_task_status(task_id: int, status: str, db: Session = Depends(auth.get_db), current: models.User = Depends(auth.get_current_active_user)):
    return crud.update_task_status(db, task_id, status)


@app.get("/operators/", response_model=list[schemas.Operator])
def list_operators(db: Session = Depends(auth.get_db), current: models.User = Depends(auth.get_current_active_user)):
    if current.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return crud.get_operators(db)


@app.post("/operators/", response_model=schemas.Operator)
def create_operator(op: schemas.OperatorCreate, db: Session = Depends(auth.get_db), current: models.User = Depends(auth.get_current_active_user)):
    if current.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return crud.create_operator(db, op)


@app.put("/operators/{op_id}", response_model=schemas.Operator)
def update_operator(op_id: int, op: schemas.OperatorCreate, db: Session = Depends(auth.get_db), current: models.User = Depends(auth.get_current_active_user)):
    if current.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    updated = crud.update_operator(db, op_id, op)
    if not updated:
        raise HTTPException(status_code=404, detail="Operator not found")
    return updated


@app.delete("/operators/{op_id}")
def delete_operator(op_id: int, db: Session = Depends(auth.get_db), current: models.User = Depends(auth.get_current_active_user)):
    if current.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    crud.delete_operator(db, op_id)
    return {"ok": True}
