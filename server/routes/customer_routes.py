from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from config.dependencies import is_admin
from controllers.customer_controller import CustomerController
from schemas.customer_schema import (
    CustomerUpdate,
    MessageResponse,
    CustomerListResponse, CustomerSingleResponse, SingleCustomerWrapper
)

router = APIRouter(prefix="/api/v1/customers", tags=["Customers"])


@router.get("/", response_model=CustomerListResponse)
def get_all_customers(
    db: Session = Depends(get_db),
    _: object = Depends(is_admin)
):
    customers = CustomerController.get_all_customers(db)
    return {
        "success": True,
        "message": "Customers fetched successfully",
        "data": customers
    }


@router.get("/{customer_id}", response_model=CustomerSingleResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(is_admin)
):
    customer = CustomerController.get_customer_by_id(db, customer_id)

    return {
        "success": True,
        "message": "Customer fetched successfully",
        "data": customer
    }


@router.put(
    "/{customer_id}",
    response_model=SingleCustomerWrapper
)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db)
):
    user = CustomerController.update_customer(db, customer_id, payload.dict(exclude_unset=True))
    return {
        "success": True,
        "message": "Customer updated successfully",
        "data": user
    }



@router.delete("/{customer_id}", response_model=MessageResponse)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(is_admin)
):
    CustomerController.delete_customer(db, customer_id)
    return {
        "success": True,
        "message": "Customer deleted successfully"
    }


@router.get("/{customer_id}/orders", response_model=MessageResponse)
def get_customer_orders(
    customer_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(is_admin)
):
    orders = CustomerController.get_customer_orders(db, customer_id)
    return {
        "success": True,
        "message": "Customer orders fetched successfully",
        "data": orders
    }


@router.get("/{customer_id}/stats", response_model=MessageResponse)
def get_customer_stats(
    customer_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(is_admin)
):
    stats = CustomerController.get_customer_stats(db, customer_id)
    return {
        "success": True,
        "message": "Customer statistics fetched successfully",
        "data": stats
    }
