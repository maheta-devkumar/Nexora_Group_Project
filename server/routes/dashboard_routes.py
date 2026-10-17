from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from controllers.dashboard_controller import DashboardController

# Remove get_current_user if you don't have it yet
from config.dependencies import get_db, get_current_user

router = APIRouter(prefix="/api/v1/admin/dashboard", tags=["Admin Dashboard"])


@router.get("/overview")
def overview(db: Session = Depends(get_db)):
    controller = DashboardController(db)
    return controller.get_overview()

@router.get("/sales")
def sales(period: str = Query("month"), db: Session = Depends(get_db)):
    controller = DashboardController(db)
    return controller.get_sales(period)

@router.get("/revenue")
def revenue(days: int = Query(30, ge=1), db: Session = Depends(get_db)):
    controller = DashboardController(db)
    return controller.get_revenue(days)

@router.get("/recent-orders")
def recent_orders(limit: int = Query(10, ge=1), db: Session = Depends(get_db)):
    controller = DashboardController(db)
    return controller.get_recent_orders(limit)

@router.get("/top-products")
def top_products(limit: int = Query(10, ge=1), db: Session = Depends(get_db)):
    controller = DashboardController(db)
    return controller.get_top_products(limit)

@router.get("/low-stock")
def low_stock(threshold: int = Query(10, ge=0), db: Session = Depends(get_db)):
    controller = DashboardController(db)
    return controller.get_low_stock(threshold)

@router.get("/system-alerts")
def system_alerts(limit: int = Query(20, ge=1), db: Session = Depends(get_db)):
    controller = DashboardController(db)
    return controller.get_system_alerts(limit)

@router.get("/category-performance")
def category_performance(db: Session = Depends(get_db)):
    controller = DashboardController(db)
    return controller.get_category_performance()

@router.get("/order-status")
def order_status(db: Session = Depends(get_db)):
    controller = DashboardController(db)
    return controller.get_order_status_distribution()

@router.get("/customers")
def customers(db: Session = Depends(get_db)):
    controller = DashboardController(db)
    return controller.get_customer_stats()

@router.get("/stock-alerts")
def stock_alerts(db: Session = Depends(get_db)):
    controller = DashboardController(db)
    return controller.get_stock_alerts()

@router.get("/traffic")
def traffic(db: Session = Depends(get_db)):
    controller = DashboardController(db)
    return controller.get_traffic()

@router.get("/returns")
def returns(period: str = Query("month"), db: Session = Depends(get_db)):
    controller = DashboardController(db)
    return controller.get_return_rate(period)