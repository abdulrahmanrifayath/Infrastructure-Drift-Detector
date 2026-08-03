from app.core.config import settings
from app.services.ai.base import BaseAIRecommendationProvider
from app.services.ai.rule_engine_provider import rule_engine_ai_provider


class AIRecommendationFactory:
    """
    Factory pattern decoupling AI engine implementation.
    Allows seamless future expansion to LLM providers (OpenAI, Gemini, Anthropic) via settings.
    """

    @staticmethod
    def get_provider() -> BaseAIRecommendationProvider:
        provider_type = getattr(settings, 'AI_ENGINE_PROVIDER', 'rule_engine').lower()

        if provider_type == "rule_engine":
            return rule_engine_ai_provider
        # Future LLM extensions:
        # elif provider_type == "openai":
        #     return OpenAIRecommendationProvider()
        # elif provider_type == "gemini":
        #     return GeminiRecommendationProvider()
        else:
            return rule_engine_ai_provider


ai_recommendation_factory = AIRecommendationFactory()
