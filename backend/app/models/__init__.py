from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class MissionStatus(str, enum.Enum):
    PLANIFIEE = "planifiee"
    EN_COURS = "en_cours"
    TERMINEE = "terminee"
    ANNULEE = "annulee"


class TaskStatus(str, enum.Enum):
    A_FAIRE = "a_faire"
    EN_COURS = "en_cours"
    TERMINEE = "terminee"


class TaskPriority(str, enum.Enum):
    BASSE = "basse"
    MOYENNE = "moyenne"
    HAUTE = "haute"
    URGENTE = "urgente"


class DocumentStatus(str, enum.Enum):
    BROUILLON = "brouillon"
    EN_REVUE = "en_revue"
    VALIDE = "valide"


class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)
    titre = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    statut = Column(String(50), default=MissionStatus.PLANIFIEE.value, nullable=False)
    date_debut = Column(DateTime(timezone=True), nullable=True)
    date_fin = Column(DateTime(timezone=True), nullable=True)
    responsable = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tasks = relationship("Task", back_populates="mission", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="mission", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, ForeignKey("missions.id", ondelete="CASCADE"), nullable=False)
    titre = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    statut = Column(String(50), default=TaskStatus.A_FAIRE.value, nullable=False)
    priorite = Column(String(50), default=TaskPriority.MOYENNE.value, nullable=False)
    assignee = Column(String(255), nullable=True)
    date_echeance = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    mission = relationship("Mission", back_populates="tasks")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, ForeignKey("missions.id", ondelete="CASCADE"), nullable=False)
    titre = Column(String(255), nullable=False)
    type_document = Column(String(100), nullable=True)
    contenu = Column(Text, nullable=True)
    statut = Column(String(50), default=DocumentStatus.BROUILLON.value, nullable=False)
    auteur = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    mission = relationship("Mission", back_populates="documents")
