from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Document, Mission
from app.schemas import DocumentCreate, DocumentUpdate, DocumentOut

router = APIRouter(prefix="/api/missions/{mission_id}/documents", tags=["documents"])


@router.get("/", response_model=list[DocumentOut])
async def list_documents(mission_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).where(Mission.id == mission_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Mission non trouvée")

    result = await db.execute(
        select(Document).where(Document.mission_id == mission_id).order_by(Document.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=DocumentOut, status_code=201)
async def create_document(mission_id: int, data: DocumentCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).where(Mission.id == mission_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Mission non trouvée")

    document = Document(mission_id=mission_id, **data.model_dump())
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return document


@router.put("/{document_id}", response_model=DocumentOut)
async def update_document(mission_id: int, document_id: int, data: DocumentUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.mission_id == mission_id)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(document, key, value)

    await db.commit()
    await db.refresh(document)
    return document


@router.delete("/{document_id}", status_code=204)
async def delete_document(mission_id: int, document_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.mission_id == mission_id)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    await db.delete(document)
    await db.commit()
