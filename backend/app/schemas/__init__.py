from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models import MissionStatus, TaskStatus, TaskPriority, DocumentStatus


# --- Mission Schemas ---
class MissionCreate(BaseModel):
    titre: str
    description: Optional[str] = None
    statut: MissionStatus = MissionStatus.PLANIFIEE
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None
    responsable: Optional[str] = None


class MissionUpdate(BaseModel):
    titre: Optional[str] = None
    description: Optional[str] = None
    statut: Optional[MissionStatus] = None
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None
    responsable: Optional[str] = None


class TaskOut(BaseModel):
    id: int
    mission_id: int
    titre: str
    description: Optional[str] = None
    statut: TaskStatus
    priorite: TaskPriority
    assignee: Optional[str] = None
    date_echeance: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: int
    mission_id: int
    titre: str
    type_document: Optional[str] = None
    contenu: Optional[str] = None
    statut: DocumentStatus
    auteur: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MissionOut(BaseModel):
    id: int
    titre: str
    description: Optional[str] = None
    statut: MissionStatus
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None
    responsable: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    tasks: list[TaskOut] = []
    documents: list[DocumentOut] = []

    model_config = {"from_attributes": True}


class MissionListOut(BaseModel):
    id: int
    titre: str
    description: Optional[str] = None
    statut: MissionStatus
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None
    responsable: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    task_count: int = 0
    document_count: int = 0

    model_config = {"from_attributes": True}


# --- Task Schemas ---
class TaskCreate(BaseModel):
    titre: str
    description: Optional[str] = None
    statut: TaskStatus = TaskStatus.A_FAIRE
    priorite: TaskPriority = TaskPriority.MOYENNE
    assignee: Optional[str] = None
    date_echeance: Optional[datetime] = None


class TaskUpdate(BaseModel):
    titre: Optional[str] = None
    description: Optional[str] = None
    statut: Optional[TaskStatus] = None
    priorite: Optional[TaskPriority] = None
    assignee: Optional[str] = None
    date_echeance: Optional[datetime] = None


# --- Document Schemas ---
class DocumentCreate(BaseModel):
    titre: str
    type_document: Optional[str] = None
    contenu: Optional[str] = None
    statut: DocumentStatus = DocumentStatus.BROUILLON
    auteur: Optional[str] = None


class DocumentUpdate(BaseModel):
    titre: Optional[str] = None
    type_document: Optional[str] = None
    contenu: Optional[str] = None
    statut: Optional[DocumentStatus] = None
    auteur: Optional[str] = None


# --- Dashboard Schema ---
class DashboardStats(BaseModel):
    total_missions: int
    missions_en_cours: int
    missions_terminees: int
    total_tasks: int
    tasks_terminees: int
    tasks_en_cours: int
    total_documents: int
    documents_valides: int
