import os

from dotenv import load_dotenv


# ----------------------------
# Environment Variables
# ----------------------------

load_dotenv()


class Settings:
    """
    Centralized application configuration.

    This class is responsible for exposing application constants
    and environment-specific settings to the rest of the project.
    """

    # ----------------------------
    # Application Configuration
    # ----------------------------

    API_TITLE: str = "Hartseer Analytics API"

    API_DESCRIPTION: str = (
        "REST API responsible for exposing business analytics "
        "data used by Hartseer Analytics dashboards."
    )

    API_VERSION: str = "1.0.0"

    # ----------------------------
    # Environment Configuration
    # ----------------------------

    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # ----------------------------
    # Database Configuration
    # ----------------------------

    DB_HOST: str = os.getenv("DB_HOST", "localhost")

    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))

    DB_NAME: str = os.getenv("DB_NAME", "")

    DB_USER: str = os.getenv("DB_USER", "")

    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")


settings = Settings()