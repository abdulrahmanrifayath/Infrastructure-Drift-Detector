import logging
import sys
from app.core.config import settings


def setup_logging() -> logging.Logger:
    """
    Configures application-wide structured logging format.
    """
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    logger = logging.getLogger("drift_detector")
    logger.setLevel(log_level)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(log_level)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


logger = setup_logging()
