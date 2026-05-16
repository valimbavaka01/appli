from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Mission, Task, Document, MissionStatus
from app.schemas import MissionCreate, MissionUpdate, MissionOut, MissionListOut

router = APIRouter(prefix="/api/missions", tags=["missions"])


@router.get("/", response_model=list[MissionListOut])
async def list_missions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Mission).order_by(Mission.created_at.desc())
    )
    missions = result.scalars().all()

    output = []
    for m in missions:
        task_count_result = await db.execute(
            select(func.count(Task.id)).where(Task.mission_id == m.id)
        )
        doc_count_result = await db.execute(
            select(func.count(Document.id)).where(Document.mission_id == m.id)
        )
        output.append(MissionListOut(
            id=m.id,
            titre=m.titre,
            description=m.description,
            statut=m.statut,
            date_debut=m.date_debut,
            date_fin=m.date_fin,
            responsable=m.responsable,
            created_at=m.created_at,
            updated_at=m.updated_at,
            task_count=task_count_result.scalar() or 0,
            document_count=doc_count_result.scalar() or 0,
        ))
    return output


@router.post("/", response_model=MissionOut, status_code=201)
async def create_mission(data: MissionCreate, db: AsyncSession = Depends(get_db)):
    mission = Mission(**data.model_dump())
    db.add(mission)
    await db.commit()
    await db.refresh(mission)
    result = await db.execute(
        select(Mission)
        .options(selectinload(Mission.tasks), selectinload(Mission.documents))
        .where(Mission.id == mission.id)
    )
    return result.scalar_one()


@router.get("/{mission_id}", response_model=MissionOut)
async def get_mission(mission_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Mission)
        .options(selectinload(Mission.tasks), selectinload(Mission.documents))
        .where(Mission.id == mission_id)
    )
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission non trouvée")
    return mission


@router.put("/{mission_id}", response_model=MissionOut)
async def update_mission(mission_id: int, data: MissionUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).where(Mission.id == mission_id))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission non trouvée")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mission, key, value)

    await db.commit()
    await db.refresh(mission)
    result = await db.execute(
        select(Mission)
        .options(selectinload(Mission.tasks), selectinload(Mission.documents))
        .where(Mission.id == mission.id)
    )
    return result.scalar_one()


@router.delete("/{mission_id}", status_code=204)
async def delete_mission(mission_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).where(Mission.id == mission_id))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission non trouvée")
    await db.delete(mission)
    await db.commit()
