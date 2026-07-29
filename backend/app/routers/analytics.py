from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.analytics import AnalyticsOverviewResponse
from app.services import analytics_service

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_overview(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Get aggregated progress tracking metrics and history for all children
    associated with the logged-in parent's materials.
    """
    stats = analytics_service.get_parent_analytics(db, current_user.id)
    return {"success": True, "data": stats}
