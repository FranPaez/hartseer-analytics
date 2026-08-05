from datetime import date

from app.repositories.marketing import marketing_repository


class MarketingService:
    """Service responsible for Marketing dashboard business logic."""

    def get_kpis(
        self,
        start_date: date,
        end_date: date,
        channel: str,
    ) -> dict:

        return marketing_repository.get_kpis(
            start_date=start_date,
            end_date=end_date,
            channel=channel,
        )


marketing_service = MarketingService()