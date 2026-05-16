from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Mission, Task, Document, MissionStatus, TaskStatus, DocumentStatus
from app.schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/", response_model=DashboardStats)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    total_missions = (await db.execute(select(func.count(Mission.id)))).scalar() or 0
    missions_en_cours = (await db.execute(
        select(func.count(Mission.id)).where(Mission.statut == MissionStatus.EN_COURS)
    )).scalar() or 0
    missions_terminees = (await db.execute(
        select(func.count(Mission.id)).where(Mission.statut == MissionStatus.TERMINEE)
    )).scalar() or 0

    total_tasks = (await db.execute(select(func.count(Task.id)))).scalar() or 0
    tasks_terminees = (await db.execute(
        select(func.count(Task.id)).where(Task.statut == TaskStatus.TERMINEE)
    )).scalar() or 0
    tasks_en_cours = (await db.execute(
        select(func.count(Task.id)).where(Task.statut == TaskStatus.EN_COURS)
    )).scalar() or 0

    total_documents = (await db.execute(select(func.count(Document.id)))).scalar() or 0
    documents_valides = (await db.execute(
        select(func.count(Document.id)).where(Document.statut == DocumentStatus.VALIDE)
    )).scalar() or 0

    return DashboardStats(
        total_missions=total_missions,
        missions_en_cours=missions_en_cours,
        missions_terminees=missions_terminees,
        total_tasks=total_tasks,
        tasks_terminees=tasks_terminees,
        tasks_en_cours=tasks_en_cours,
        total_documents=total_documents,
        documents_valides=documents_valides,
    )
