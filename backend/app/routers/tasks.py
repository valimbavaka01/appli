from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Task, Mission
from app.schemas import TaskCreate, TaskUpdate, TaskOut

router = APIRouter(prefix="/api/missions/{mission_id}/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskOut])
async def list_tasks(mission_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).where(Mission.id == mission_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Mission non trouvée")

    result = await db.execute(
        select(Task).where(Task.mission_id == mission_id).order_by(Task.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=TaskOut, status_code=201)
async def create_task(mission_id: int, data: TaskCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).where(Mission.id == mission_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Mission non trouvée")

    task = Task(mission_id=mission_id, **data.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskOut)
async def update_task(mission_id: int, task_id: int, data: TaskUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.mission_id == mission_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(mission_id: int, task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.mission_id == mission_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    await db.delete(task)
    await db.commit()
