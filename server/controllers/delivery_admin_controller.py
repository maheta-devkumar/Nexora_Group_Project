from sqlalchemy.orm import Session
from services.delivery_admin_service import DeliveryAdminService


class DeliveryAdminController:

    def __init__(self, db: Session):
        self.service = DeliveryAdminService(db)

    # EXISTING METHODS (Preserved exactly as they were)
    def getOverview(self):
        """Get refined overview stats for dashboard (Optimization)"""
        return self.service.getDeliveryOverview()

    def assignDeliveryPerson(self, order_id, delivery_person_id):
        return self.service.assignDeliveryPerson(order_id, delivery_person_id)

    def getAllDeliveries(self):
        return self.service.getAllDeliveries()

    def getDeliveryStats(self):
        return self.service.getDeliveryStats()

    def updateDeliveryStatus(self, delivery_id, status):
        return self.service.updateDeliveryStatus(delivery_id, status)

    def reassignDeliveryPerson(self, delivery_id, new_person_id):
        return self.service.reassignDeliveryPerson(delivery_id, new_person_id)

    def getDeliveryEarnings(self):
        return self.service.getDeliveryEarnings()

    def getDeliveryPersonPerformance(self):
        return self.service.getDeliveryPersonPerformance()

    def searchDeliveries(self, filters):
        return self.service.searchDeliveries(filters)

    def getDeliveryTimeline(self, delivery_id):
        return self.service.getDeliveryTimeline(delivery_id)

    def cancelDelivery(self, delivery_id):
        return self.service.cancelDelivery(delivery_id)

    def validateDeliveryCompletion(self, delivery_id):
        return self.service.validateDeliveryCompletion(delivery_id)

    def getDeliveryIssues(self):
        return self.service.getDeliveryIssues()

        # NEW METHODS for ADMIN ONLY (4 essential ones)
    def handleOrderCreatedWebhook(self, order_data):
        """Webhook for order creation - create delivery in pool & auto-send notifications"""
        return self.service.handleOrderCreatedWebhook(order_data)

    def getAvailableDeliveryPersons(self):
        """Get available delivery persons (admin view)"""
        return self.service.getAvailableDeliveryPersons()

    def getDeliveryPool(self):
        """Get available deliveries in pool (admin view)"""
        return self.service.getDeliveryPool()

    def notifyDeliveryPerson(self, notification_data):
        """Admin manually sends notification to specific delivery person"""
        return self.service.notifyDeliveryPerson(notification_data)
    
    def cancelDeliveryAdmin(self, delivery_id):
        """Admin cancels delivery"""
        return self.service.cancelDeliveryAdmin(delivery_id)