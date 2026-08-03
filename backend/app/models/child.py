import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Child(Base):
    __tablename__ = "children"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(50), nullable=False)
    difficulty_level = Column(String(20), default="medium", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    parent = relationship("User", backref="children")
    submissions = relationship("Submission", back_populates="child")
    assignments = relationship(
        "MaterialAssignment", back_populates="child", cascade="all, delete-orphan"
    )
