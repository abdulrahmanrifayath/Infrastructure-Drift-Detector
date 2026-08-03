from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text
from app.domain.models.base import BaseModel


class Recommendation(BaseModel):
    """
    Recommendation entity storing AI-generated cloud governance and cost remediation guidance.
    """
    __tablename__ = "recommendations"

    drift_event_id = Column(Integer, ForeignKey("drift_events.id"), nullable=False, unique=True, index=True)
    provider_id = Column(String(255), nullable=False, index=True)
    priority_score = Column(Integer, nullable=False, index=True)  # 0 to 100
    explanation = Column(Text, nullable=False)
    business_impact = Column(Text, nullable=False)
    security_impact = Column(Text, nullable=False)
    estimated_monthly_cost = Column(Float, default=0.0, nullable=False)
    recommended_fix = Column(Text, nullable=False)
    estimated_fix_time = Column(String(50), default="15 mins", nullable=False)
