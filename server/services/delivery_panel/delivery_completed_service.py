from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date

# Import repository
from repositories.delivery_panel.delivery_completed_repository import DeliveryCompletedRepository

# Import schemas
from schemas.delivery_panel.delivery_completed_schema import (
    CompletedDeliveriesResponse, CompletedDeliveryResponse, PODResponse,
    CompletedDeliveryItem, CompletedDeliveryDetail, PODInfo,
    CustomerInfo, DeliveryEarningsInfo, CustomerRatingInfo, AddressInfo,
    CompletedSummary, DateFilterRequest, PaginationRequest,
    CompletedDeliveriesFilter, DeliveryStatus, PaymentType,
    ErrorResponse
)

# Import models for type hints
from models.delivery.delivery import Delivery
from models.order.order import Order
from models.user import User
from models.address import Address, Area, City


class DeliveryCompletedService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DeliveryCompletedRepository()
    
    def _format_order_number(self, order_id: int) -> str:
        """Format order ID to display number (ORD-XXXXX)"""
        return f"ORD-{order_id:05d}"
    
    def _get_expected_vs_actual(self, delivery: Delivery) -> Optional[str]:
        """Get expected vs actual delivery status"""
        if not delivery.expected_delivery_time or not delivery.actual_delivery_time:
            return None
        
        time_diff = (delivery.actual_delivery_time - delivery.expected_delivery_time).total_seconds() / 60
        
        if time_diff <= 0:
            return "Early"
        elif time_diff <= 30:
            return "On time"
        else:
            return "Late"
    
    def _build_customer_info(self, user: User) -> CustomerInfo:
        """Build customer info from User model"""
        return CustomerInfo(
            customer_id=user.user_id,
            name=f"{user.first_name} {user.last_name}",
            phone=user.phone,
            avatar_url=user.profile_img_url
        )
    
    def _build_address_info(self, address: Address, area: Area, city: City) -> AddressInfo:
        """Build address info from address models"""
        return AddressInfo(
            address_line1=address.line1,
            address_line2=address.line2,
            area_name=area.area_name,
            city_name=city.city_name,
            pincode=area.pincode
        )
    
    def _build_earnings_info(self, delivery_id: int, delivery_person_id: int) -> DeliveryEarningsInfo:
        """Build earnings info for a delivery"""
        earnings_data = self.repository.get_delivery_earnings(
            self.db, delivery_id, delivery_person_id
        )
        
        if earnings_data:
            return DeliveryEarningsInfo(**earnings_data)
        
        # Default if no earnings record found
        return DeliveryEarningsInfo(
            amount=0.0,
            is_settled=False
        )
    
    def _build_rating_info(self, order_id: int, delivery_id: int) -> CustomerRatingInfo:
        """Build rating info for a delivery"""
        rating_data = self.repository.get_customer_rating(
            self.db, order_id, delivery_id
        )
        
        if rating_data:
            return CustomerRatingInfo(**rating_data)
        
        # Default if no rating
        return CustomerRatingInfo(
            rating=None,
            review_id=None,
            review_text=None,
            created_at=None
        )
    
    def _build_pod_info(self, delivery_id: int, delivery_person_id: int) -> PODInfo:
        """Build POD info for a delivery"""
        pod_data = self.repository.get_proof_of_delivery(
            self.db, delivery_id, delivery_person_id
        )
        
        if pod_data:
            return PODInfo(**pod_data)
        
        # Default if no POD
        return PODInfo(
            pod_image_url=None,
            signature_url=None,
            delivery_notes=None,
            has_pod=False
        )
    
    def _build_completed_delivery_item(
        self,
        delivery: Delivery,
        order: Order,
        user: User,
        address: Address,
        area: Area,
        city: City,
        delivery_person_id: int
    ) -> CompletedDeliveryItem:
        """Build a single completed delivery item"""
        
        # Get additional data
        items_count = self.repository.get_delivery_items_count(self.db, order.order_id)
        payment_info = self.repository.get_payment_info(self.db, order.order_id)
        
        # Build the item
        return CompletedDeliveryItem(
            delivery_id=delivery.delivery_id,
            order_id=order.order_id,
            order_number=self._format_order_number(order.order_id),
            delivery_status=DeliveryStatus(delivery.status),
            delivered_at=delivery.delivered_at,
            delivery_person_id=delivery_person_id,
            
            # Customer info
            customer=self._build_customer_info(user),
            
            # Address info
            address=self._build_address_info(address, area, city),
            
            # Order details
            total_amount=float(order.total_amount),
            payment_type=PaymentType(payment_info["payment_type"]),
            items_count=items_count,
            
            # Earnings
            earnings=self._build_earnings_info(delivery.delivery_id, delivery_person_id),
            
            # Rating
            rating=self._build_rating_info(order.order_id, delivery.delivery_id),
            
            # POD availability
            has_pod=bool(delivery.pod_image_url or delivery.signature_url),
            
            # Additional info
            distance_km=float(delivery.distance_km) if delivery.distance_km else None,
            expected_vs_actual=self._get_expected_vs_actual(delivery)
        )
    
    def get_completed_deliveries(
        self,
        delivery_person_id: int,
        filters: Optional[CompletedDeliveriesFilter] = None
    ) -> CompletedDeliveriesResponse:
        """Get completed deliveries with filters"""
        try:
            # Get data from repository
            results, total_count = self.repository.get_completed_deliveries(
                self.db, delivery_person_id, filters
            )
            
            # Build response items
            delivery_items = []
            for delivery, order, user, address, area, city in results:
                item = self._build_completed_delivery_item(
                    delivery, order, user, address, area, city, delivery_person_id
                )
                delivery_items.append(item)
            
            # Get summary statistics
            start_date = None
            end_date = None
            if filters and filters.date_filter:
                start_date = filters.date_filter.start_date
                end_date = filters.date_filter.end_date
            
            summary_data = self.repository.get_summary_statistics(
                self.db, delivery_person_id, start_date, end_date
            )
            
            # Build pagination info
            pagination_info = None
            if filters and filters.pagination:
                page = filters.pagination.page
                per_page = filters.pagination.per_page
                total_pages = (total_count + per_page - 1) // per_page if per_page > 0 else 1
                
                pagination_info = {
                    "page": page,
                    "per_page": per_page,
                    "total_items": total_count,
                    "total_pages": total_pages,
                    "has_next": page < total_pages,
                    "has_previous": page > 1
                }
            
            # Build filters info
            filters_info = None
            if filters:
                filters_info = {
                    "date_range": {
                        "start": filters.date_filter.start_date.isoformat() if filters.date_filter and filters.date_filter.start_date else None,
                        "end": filters.date_filter.end_date.isoformat() if filters.date_filter and filters.date_filter.end_date else None,
                        "period": filters.date_filter.period if filters.date_filter else None
                    } if filters.date_filter else None,
                    "status": filters.status.value if filters.status else None,
                    "earning_range": {
                        "min": filters.min_earning,
                        "max": filters.max_earning
                    } if filters.min_earning or filters.max_earning else None
                }
            
            # Build summary
            summary = CompletedSummary(**summary_data)
            if filters and filters.date_filter:
                summary.period_deliveries = len(delivery_items)
                summary.period_earnings = sum(item.earnings.amount for item in delivery_items)
            
            return CompletedDeliveriesResponse(
                data=delivery_items,
                pagination=pagination_info,
                filters=filters_info,
                summary=summary.model_dump()
            )
            
        except Exception as e:
            # Log error in production
            # logger.error(f"Error getting completed deliveries: {str(e)}")
            return CompletedDeliveriesResponse(
                success=False,
                message=f"Failed to get completed deliveries: {str(e)}",
                data=[],
                summary={
                    "total_deliveries": 0,
                    "total_earnings": 0.0,
                    "average_rating": 0.0,
                    "on_time_rate": 0.0,
                    "completed_today": 0,
                    "earnings_today": 0.0
                }
            )
    
    def get_completed_delivery_detail(
        self,
        delivery_person_id: int,
        delivery_id: int
    ) -> CompletedDeliveryResponse:
        """Get detailed information for a specific completed delivery"""
        try:
            # Validate access
            if not self.repository.validate_delivery_access(self.db, delivery_id, delivery_person_id):
                return CompletedDeliveryResponse(
                    success=False,
                    message="Delivery not found or access denied",
                    data=None
                )
            
            # Get data from repository
            result = self.repository.get_completed_delivery_by_id(
                self.db, delivery_person_id, delivery_id
            )
            
            if not result:
                return CompletedDeliveryResponse(
                    success=False,
                    message="Delivery not found",
                    data=None
                )
            
            delivery, order, user, address, area, city = result
            
            # Get additional details
            items_count = self.repository.get_delivery_items_count(self.db, order.order_id)
            payment_info = self.repository.get_payment_info(self.db, order.order_id)
            pod_info = self._build_pod_info(delivery.delivery_id, delivery_person_id)
            performance_metrics = self.repository.get_delivery_performance_metrics(
                self.db, delivery.delivery_id
            )
            
            # Build base item
            base_item = self._build_completed_delivery_item(
                delivery, order, user, address, area, city, delivery_person_id
            )
            
            # Convert to detailed view
            detail_data = base_item.model_dump()
            
            # Add extended details
            detail_data.update({
                # Extended address
                "address_full": base_item.address.full_address,
                
                # Order extended details
                "subtotal": float(order.subtotal),
                "discount_amount": float(order.discount_amount),
                "delivery_fee": float(order.delivery_fee),
                "tax_amount": float(order.tax_amount),
                "coupon_code": order.coupon_code,
                
                # Delivery extended details
                "assigned_at": delivery.assigned_at,
                "picked_up_at": None,  # Not in current model
                "expected_delivery_time": delivery.expected_delivery_time,
                "delivery_notes": delivery.delivery_notes,
                "distance_km": float(delivery.distance_km) if delivery.distance_km else None,
                
                # POD details
                "pod_info": pod_info.model_dump(),
                
                # Performance metrics
                "delivery_duration_minutes": performance_metrics["delivery_duration_minutes"] if performance_metrics else None,
                "is_on_time": performance_metrics["is_on_time"] if performance_metrics else None,
            })
            
            detail = CompletedDeliveryDetail(**detail_data)
            
            return CompletedDeliveryResponse(
                data=detail
            )
            
        except Exception as e:
            # Log error in production
            # logger.error(f"Error getting delivery detail: {str(e)}")
            return CompletedDeliveryResponse(
                success=False,
                message=f"Failed to get delivery details: {str(e)}",
                data=None
            )
    
    def get_proof_of_delivery(
        self,
        delivery_person_id: int,
        delivery_id: int
    ) -> PODResponse:
        """Get Proof of Delivery for a completed delivery"""
        try:
            # Validate access
            if not self.repository.validate_delivery_access(self.db, delivery_id, delivery_person_id):
                return PODResponse(
                    success=False,
                    message="Delivery not found or access denied"
                )
            
            # Get POD info
            pod_data = self.repository.get_proof_of_delivery(
                self.db, delivery_id, delivery_person_id
            )
            
            if not pod_data:
                return PODResponse(
                    success=False,
                    message="No Proof of Delivery found for this delivery"
                )
            
            pod_info = PODInfo(**pod_data)
            
            return PODResponse(
                data=pod_info
            )
            
        except Exception as e:
            # Log error in production
            # logger.error(f"Error getting POD: {str(e)}")
            return PODResponse(
                success=False,
                message=f"Failed to get Proof of Delivery: {str(e)}"
            )
    
    def get_summary_statistics(
        self,
        delivery_person_id: int,
        date_filter: Optional[DateFilterRequest] = None
    ) -> Dict[str, Any]:
        """Get summary statistics for completed deliveries"""
        try:
            start_date = date_filter.start_date if date_filter else None
            end_date = date_filter.end_date if date_filter else None
            
            summary_data = self.repository.get_summary_statistics(
                self.db, delivery_person_id, start_date, end_date
            )
            
            return {
                "success": True,
                "message": "Summary statistics retrieved successfully",
                "data": summary_data
            }
            
        except Exception as e:
            # Log error in production
            # logger.error(f"Error getting summary statistics: {str(e)}")
            return {
                "success": False,
                "message": f"Failed to get summary statistics: {str(e)}",
                "data": {
                    "total_deliveries": 0,
                    "total_earnings": 0.0,
                    "average_rating": 0.0,
                    "on_time_rate": 0.0,
                    "completed_today": 0,
                    "earnings_today": 0.0
                }
            }
    
    def apply_date_filters(
        self,
        delivery_person_id: int,
        date_filter: DateFilterRequest
    ) -> CompletedDeliveriesResponse:
        """Get completed deliveries filtered by date"""
        filters = CompletedDeliveriesFilter(
            date_filter=date_filter,
            pagination=PaginationRequest(page=1, per_page=50)
        )
        
        return self.get_completed_deliveries(delivery_person_id, filters)