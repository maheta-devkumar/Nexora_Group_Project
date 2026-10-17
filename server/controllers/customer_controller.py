from sqlalchemy.orm import Session
from services.customer_service import CustomerService


class CustomerController:

    @staticmethod
    def get_all_customers(db: Session):
        return CustomerService.get_all_customers(db)

    @staticmethod
    def get_customer_by_id(db: Session, customer_id: int):
        return CustomerService.get_customer_by_id(db, customer_id)

    @staticmethod
    def update_customer(db: Session, customer_id: int, data: dict):
        return CustomerService.update_customer(db, customer_id, data)

    @staticmethod
    def delete_customer(db: Session, customer_id: int):
        CustomerService.delete_customer(db, customer_id)

    @staticmethod
    def get_customer_orders(db: Session, customer_id: int):
        return CustomerService.get_customer_orders(db, customer_id)

    @staticmethod
    def get_customer_stats(db: Session, customer_id: int):
        return CustomerService.get_customer_stats(db, customer_id)
