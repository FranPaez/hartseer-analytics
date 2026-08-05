from datetime import date

from app.core.responses import success_response
from app.services.marketing import marketing_service


class MarketingController:
    """Controller responsible for Marketing dashboard endpoints."""

    def get_dashboard(
        self,
        start_date: date,
        end_date: date,
        channel: str,
    ):

        data = marketing_service.get_kpis(
            start_date=start_date,
            end_date=end_date,
            channel=channel,
        )

        return success_response(data)


marketing_controller = MarketingController()