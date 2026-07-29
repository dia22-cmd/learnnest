import uuid
from datetime import datetime
from typing import List, Dict
from pydantic import BaseModel


class WorksheetAttempt(BaseModel):
    material_id: uuid.UUID
    title: str
    average_score: float
    submitted_at: datetime


class ChildStats(BaseModel):
    child_name: str
    average_score: float
    total_worksheets: int
    total_questions: int
    history: List[WorksheetAttempt]


class AnalyticsOverviewResponse(BaseModel):
    success: bool
    data: Dict[str, ChildStats]
