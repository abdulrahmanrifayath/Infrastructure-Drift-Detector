from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseAIRecommendationProvider(ABC):
    """
    Abstract interface for AI Recommendation Engine providers.
    Supports modular extension (e.g. RuleEngineAIProvider, OpenAIProvider, GeminiProvider).
    """

    @abstractmethod
    def generate_recommendation_payload(self, drift_event: Any) -> Dict[str, Any]:
        """
        Generates structured recommendation dictionary containing:
        - priority_score (0-100)
        - explanation
        - business_impact
        - security_impact
        - estimated_monthly_cost
        - recommended_fix
        - estimated_fix_time
        """
        pass
