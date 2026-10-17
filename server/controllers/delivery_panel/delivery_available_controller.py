from sqlalchemy.orm import Session
from services.delivery_panel.delivery_available_service import DeliveryAvailableService


class DeliveryAvailableController:

    def __init__(self, db: Session):
        self.service = DeliveryAvailableService(db)

    def get_available_deliveries_for_delivery_person(self):
        """Get available deliveries for delivery person"""
        return self.service.fetchAvailableDeliveries()

    def accept_delivery(self, delivery_id, delivery_person_id):
        """Accept delivery by delivery person"""
        return self.service.assignDeliveryToPerson(delivery_id, delivery_person_id)

    def cancel_delivery(self, delivery_id, delivery_person_id):
        """Cancel delivery by delivery person"""
        return self.service.cancelDelivery(delivery_id, delivery_person_id)