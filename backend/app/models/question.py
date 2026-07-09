import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id = Column(UUID(as_uuid=True), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # "mcq" or "short_answer"
    question = Column(Text, nullable=False)
    options = Column(JSON().with_variant(JSONB(), "postgresql"), nullable=True)  # List of strings for MCQ options, null for short_answer
    answer = Column(Text, nullable=False)  # Correct or reference answer
    is_selected = Column(Boolean, default=False, nullable=False)  # Assigned to child if True

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    material = relationship("Material", back_populates="questions")
    submissions = relationship("Submission", back_populates="question", cascade="all, delete-orphan")
