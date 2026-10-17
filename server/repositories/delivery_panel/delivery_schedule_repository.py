# delivery_panel/schedule/delivery_schedule_repository.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc, and_, or_, case, text, extract, Date, cast
from sqlalchemy.sql import label, literal_column
from datetime import datetime, timedelta, date, time
from typing import List, Optional, Dict, Any, Tuple
from decimal import Decimal

# Import models from the provided structure
from models.delivery.delivery import Delivery
from models.delivery.delivery_person import DeliveryPerson
from models.delivery.delivery_earnings import DeliveryEarnings
from models.order.order import Order
from models.order.order_item import OrderItem
from models.user import User
from models.address import Address, Area, City
from models.payment import Payment

# Import schemas
from schemas.delivery_panel.delivery_schedule_schema import ShiftFilters, ShiftStatus


class DeliveryScheduleRepository:
    """Repository for schedule-related database operations"""
    
    # ===== TODAY'S SHIFT =====
    
    @staticmethod
    def get_todays_shift(
        db: Session,
        delivery_person_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get today's shift for delivery person based on deliveries"""
        
        today = date.today()
        
        # Get today's deliveries to determine shift
        todays_deliveries = db.query(Delivery).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(Delivery.assigned_at) == today
            )
        ).order_by(Delivery.assigned_at).all()
        
        if not todays_deliveries:
            return None
        
        # Determine shift times based on delivery assignments
        first_delivery = todays_deliveries[0]
        last_delivery = todays_deliveries[-1]
        
        # Calculate shift start (first delivery assignment time minus buffer)
        shift_start = first_delivery.assigned_at.replace(
            hour=9, minute=0, second=0  # Default to 9 AM
        )
        
        # Calculate shift end (last expected delivery time plus buffer)
        if last_delivery.expected_delivery_time:
            shift_end = last_delivery.expected_delivery_time.replace(
                hour=18, minute=0, second=0  # Default to 6 PM
            )
        else:
            shift_end = shift_start.replace(hour=18, minute=0, second=0)
        
        # Count deliveries
        total_deliveries = len(todays_deliveries)
        completed_deliveries = len([d for d in todays_deliveries if d.status == "DELIVERED"])
        
        # Calculate estimated earnings from today's deliveries
        earnings_query = db.query(
            func.sum(DeliveryEarnings.amount).label('total_earnings')
        ).join(Delivery).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(DeliveryEarnings.earned_at) == today
            )
        ).first()
        
        estimated_earnings = float(earnings_query.total_earnings) if earnings_query and earnings_query.total_earnings else 0.0
        
        # If no earnings yet, estimate based on delivery fee
        if estimated_earnings == 0:
            order_ids = [d.order_id for d in todays_deliveries]
            if order_ids:
                fee_query = db.query(
                    func.sum(Order.delivery_fee).label('total_fee')
                ).filter(Order.order_id.in_(order_ids)).first()
                estimated_earnings = float(fee_query.total_fee) if fee_query and fee_query.total_fee else 0.0
        
        # Determine shift status
        current_time = datetime.utcnow()
        shift_status = "assigned"
        
        if shift_end and current_time > shift_end:
            shift_status = "completed"
        elif shift_start and current_time >= shift_start:
            shift_status = "active"
        
        # Get common delivery area for shift location
        area_info = None
        if todays_deliveries:
            # Try to get area from first delivery's order address
            first_order = db.query(Order).filter(
                Order.order_id == first_delivery.order_id
            ).first()
            
            if first_order and first_order.address_id:
                address_info = db.query(
                    Address, Area, City
                ).join(
                    Area, Area.area_id == Address.area_id
                ).join(
                    City, City.city_id == Area.city_id
                ).filter(
                    Address.address_id == first_order.address_id
                ).first()
                
                if address_info:
                    address, area, city = address_info
                    area_info = {
                        "name": area.area_name,
                        "address": f"{area.area_name}, {city.city_name}",
                        "zone": area.area_name
                    }
        
        # Default location if no area info
        if not area_info:
            area_info = {
                "name": "Assigned Zone",
                "address": "Delivery Area",
                "zone": "Default Zone"
            }
        
        return {
            "shift_id": 1,  # Using delivery person ID + date as shift ID
            "date": today,
            "day_name": today.strftime("%A"),
            "time": {
                "start": shift_start.strftime("%H:%M"),
                "end": shift_end.strftime("%H:%M")
            },
            "location": area_info,
            "status": shift_status,
            "is_today": True,
            "is_current": shift_status == "active",
            "deliveries_assigned": total_deliveries,
            "deliveries_completed": completed_deliveries,
            "estimated_earnings": estimated_earnings
        }
    
    # ===== UPCOMING SHIFTS =====
    
    @staticmethod
    def get_upcoming_shifts(
        db: Session,
        delivery_person_id: int,
        days_ahead: int = 30
    ) -> List[Dict[str, Any]]:
        """Get upcoming shifts for next N days"""
        
        today = date.today()
        end_date = today + timedelta(days=days_ahead)
        
        # Get deliveries for upcoming days
        upcoming_deliveries = db.query(
            func.date(Delivery.assigned_at).label('delivery_date'),
            func.count(Delivery.delivery_id).label('delivery_count'),
            func.min(Delivery.assigned_at).label('first_assignment'),
            func.max(
                case(
                    (Delivery.expected_delivery_time.isnot(None), Delivery.expected_delivery_time),
                    else_=Delivery.assigned_at + timedelta(hours=8)  # Default 8-hour shift
                )
            ).label('last_expected')
        ).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(Delivery.assigned_at) > today,
                func.date(Delivery.assigned_at) <= end_date,
                Delivery.status.in_(["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"])  # Only active/upcoming
            )
        ).group_by(func.date(Delivery.assigned_at)).order_by('delivery_date').all()
        
        shifts = []
        
        for delivery_date, delivery_count, first_assignment, last_expected in upcoming_deliveries:
            # Calculate days until this shift
            days_until = (delivery_date - today).days
            
            # Determine shift times
            if first_assignment:
                shift_start = first_assignment.replace(hour=9, minute=0, second=0)
            else:
                shift_start = datetime.combine(delivery_date, time(9, 0, 0))
            
            if last_expected:
                shift_end = last_expected.replace(hour=18, minute=0, second=0)
            else:
                shift_end = shift_start.replace(hour=18, minute=0, second=0)
            
            # Get area info for this day's deliveries
            area_query = db.query(
                Area.area_name,
                City.city_name
            ).select_from(Delivery).join(
                Order, Order.order_id == Delivery.order_id
            ).join(
                Address, Address.address_id == Order.address_id
            ).join(
                Area, Area.area_id == Address.area_id
            ).join(
                City, City.city_id == Area.city_id
            ).filter(
                and_(
                    Delivery.delivery_person_id == delivery_person_id,
                    func.date(Delivery.assigned_at) == delivery_date
                )
            ).group_by(Area.area_name, City.city_name).first()
            
            if area_query:
                area_name, city_name = area_query
                location_info = {
                    "name": area_name,
                    "address": f"{area_name}, {city_name}",
                    "zone": area_name
                }
            else:
                location_info = {
                    "name": "Assigned Zone",
                    "address": "Delivery Area",
                    "zone": "Default Zone"
                }
            
            # Estimate earnings based on average delivery fee
            estimated_earnings = delivery_count * 100  # Default ₹100 per delivery
            
            shift_data = {
                "shift_id": hash(f"{delivery_person_id}_{delivery_date}"),  # Generate unique ID
                "date": delivery_date,
                "day_name": delivery_date.strftime("%A"),
                "time": {
                    "start": shift_start.strftime("%H:%M"),
                    "end": shift_end.strftime("%H:%M")
                },
                "location": location_info,
                "status": "upcoming",
                "days_until": days_until,
                "estimated_deliveries": delivery_count,
                "estimated_earnings": estimated_earnings,
                "notes": f"{delivery_count} deliveries scheduled"
            }
            
            shifts.append(shift_data)
        
        return shifts
    
    # ===== ALL ASSIGNED SHIFTS (CALENDAR VIEW) =====
    
    @staticmethod
    def get_all_shifts(
        db: Session,
        delivery_person_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        include_completed: bool = True
    ) -> List[Dict[str, Any]]:
        """Get all shifts for calendar view"""
        
        # Default to current month if no date range specified
        if not start_date:
            today = date.today()
            start_date = today.replace(day=1)
        
        if not end_date:
            if start_date.month == 12:
                end_date = start_date.replace(year=start_date.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end_date = start_date.replace(month=start_date.month + 1, day=1) - timedelta(days=1)
        
        # Get deliveries within date range
        deliveries_query = db.query(
            func.date(Delivery.assigned_at).label('delivery_date'),
            func.count(Delivery.delivery_id).label('delivery_count'),
            func.sum(case((Delivery.status == "DELIVERED", 1), else_=0)).label('completed_count'),
            func.min(Delivery.assigned_at).label('first_assignment'),
            func.max(Delivery.assigned_at).label('last_assignment')
        ).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(Delivery.assigned_at) >= start_date,
                func.date(Delivery.assigned_at) <= end_date
            )
        )
        
        if not include_completed:
            deliveries_query = deliveries_query.filter(
                Delivery.status.in_(["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"])
            )
        
        deliveries_by_date = deliveries_query.group_by(
            func.date(Delivery.assigned_at)
        ).order_by('delivery_date').all()
        
        shifts = []
        today = date.today()
        
        for delivery_date, delivery_count, completed_count, first_assignment, last_assignment in deliveries_by_date:
            # Determine shift status
            if delivery_date < today:
                status = "completed"
            elif delivery_date == today:
                # Check if shift is ongoing
                current_time = datetime.utcnow()
                if first_assignment and current_time > first_assignment:
                    status = "active"
                else:
                    status = "assigned"
            else:
                status = "upcoming"
            
            # Calculate shift times
            if first_assignment:
                shift_start = first_assignment.replace(hour=9, minute=0, second=0)
            else:
                shift_start = datetime.combine(delivery_date, time(9, 0, 0))
            
            if last_assignment:
                shift_end = last_assignment.replace(hour=18, minute=0, second=0)
            else:
                shift_end = shift_start.replace(hour=18, minute=0, second=0)
            
            # Get area for this day
            area_query = db.query(
                Area.area_name,
                City.city_name
            ).select_from(Delivery).join(
                Order, Order.order_id == Delivery.order_id
            ).join(
                Address, Address.address_id == Order.address_id
            ).join(
                Area, Area.area_id == Address.area_id
            ).join(
                City, City.city_id == Area.city_id
            ).filter(
                and_(
                    Delivery.delivery_person_id == delivery_person_id,
                    func.date(Delivery.assigned_at) == delivery_date
                )
            ).group_by(Area.area_name, City.city_name).first()
            
            if area_query:
                area_name, city_name = area_query
                location_info = {
                    "name": area_name,
                    "address": f"{area_name}, {city_name}",
                    "zone": area_name
                }
            else:
                location_info = {
                    "name": "Assigned Zone",
                    "address": "Delivery Area",
                    "zone": "Default Zone"
                }
            
            # Calculate earnings
            earnings_query = db.query(
                func.sum(DeliveryEarnings.amount).label('total_earnings')
            ).join(Delivery).filter(
                and_(
                    Delivery.delivery_person_id == delivery_person_id,
                    func.date(Delivery.assigned_at) == delivery_date
                )
            ).first()
            
            estimated_earnings = float(earnings_query.total_earnings) if earnings_query and earnings_query.total_earnings else 0.0
            
            shift_data = {
                "shift_id": hash(f"{delivery_person_id}_{delivery_date}"),
                "date": delivery_date,
                "day_name": delivery_date.strftime("%A"),
                "time": {
                    "start": shift_start.strftime("%H:%M"),
                    "end": shift_end.strftime("%H:%M")
                },
                "location": location_info,
                "status": status,
                "is_today": delivery_date == today,
                "is_current": status == "active",
                "deliveries_assigned": delivery_count,
                "deliveries_completed": completed_count or 0,
                "estimated_earnings": estimated_earnings
            }
            
            shifts.append(shift_data)
        
        return shifts
    
    # ===== CALENDAR DATA =====
    
    @staticmethod
    def get_calendar_data(
        db: Session,
        delivery_person_id: int,
        year: int,
        month: int
    ) -> Dict[str, Any]:
        """Get calendar data for specific month"""
        
        import calendar
        
        # Create date range for the month
        month_start = date(year, month, 1)
        if month == 12:
            month_end = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(year, month + 1, 1) - timedelta(days=1)
        
        # Get all shifts for the month
        shifts = DeliveryScheduleRepository.get_all_shifts(
            db, delivery_person_id, month_start, month_end, True
        )
        
        # Organize shifts by date
        shifts_by_date = {}
        for shift in shifts:
            shift_date = shift["date"]
            if shift_date not in shifts_by_date:
                shifts_by_date[shift_date] = []
            shifts_by_date[shift_date].append(shift)
        
        # Create calendar structure
        cal = calendar.monthcalendar(year, month)
        weeks = []
        today = date.today()
        
        for week_num, week_days in enumerate(cal, 1):
            calendar_days = []
            
            for day in week_days:
                if day == 0:  # Day outside current month
                    calendar_days.append(None)
                    continue
                
                current_date = date(year, month, day)
                day_shifts = shifts_by_date.get(current_date, [])
                
                day_data = {
                    "date": current_date,
                    "day_name": current_date.strftime("%A"),
                    "day_number": day,
                    "has_shift": len(day_shifts) > 0,
                    "shift_count": len(day_shifts),
                    "shifts": day_shifts
                }
                
                calendar_days.append(day_data)
            
            # Filter out None days
            valid_days = [day for day in calendar_days if day is not None]
            
            if valid_days:
                week_start = valid_days[0]["date"]
                week_end = valid_days[-1]["date"]
                
                week_data = {
                    "week_number": week_num,
                    "start_date": week_start,
                    "end_date": week_end,
                    "days": valid_days
                }
                
                weeks.append(week_data)
        
        # Calculate totals
        total_shifts = len(shifts)
        completed_shifts = len([s for s in shifts if s["status"] == "completed"])
        upcoming_shifts = len([s for s in shifts if s["status"] in ["upcoming", "assigned", "active"]])
        
        # Calculate previous and next months
        if month == 1:
            prev_month = date(year - 1, 12, 1)
        else:
            prev_month = date(year, month - 1, 1)
        
        if month == 12:
            next_month = date(year + 1, 1, 1)
        else:
            next_month = date(year, month + 1, 1)
        
        return {
            "current_month": month_start.strftime("%B %Y"),
            "weeks": weeks,
            "total_shifts": total_shifts,
            "completed_shifts": completed_shifts,
            "upcoming_shifts": upcoming_shifts,
            "previous_month": prev_month.strftime("%B %Y"),
            "next_month": next_month.strftime("%B %Y")
        }
    
    # ===== SCHEDULE SUMMARY =====
    
    @staticmethod
    def get_schedule_summary(
        db: Session,
        delivery_person_id: int
    ) -> Dict[str, Any]:
        """Get overall schedule summary"""
        
        today = date.today()
        
        # Calculate date ranges
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        next_week_start = week_start + timedelta(days=7)
        next_week_end = next_week_start + timedelta(days=6)
        
        month_start = today.replace(day=1)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1, day=1) - timedelta(days=1)
        
        # Get counts for different periods
        # Total assigned shifts (all time)
        total_query = db.query(
            func.count(func.distinct(func.date(Delivery.assigned_at))).label('total_days')
        ).filter(
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        total_assigned_shifts = total_query.total_days if total_query else 0
        
        # Completed shifts (past shifts)
        completed_query = db.query(
            func.count(func.distinct(func.date(Delivery.assigned_at))).label('completed_days')
        ).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(Delivery.assigned_at) < today
            )
        ).first()
        
        completed_shifts = completed_query.completed_days if completed_query else 0
        
        # Upcoming shifts (future)
        upcoming_query = db.query(
            func.count(func.distinct(func.date(Delivery.assigned_at))).label('upcoming_days')
        ).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(Delivery.assigned_at) >= today,
                Delivery.status.in_(["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"])
            )
        ).first()
        
        upcoming_shifts = upcoming_query.upcoming_days if upcoming_query else 0
        
        # Cancelled shifts
        cancelled_query = db.query(
            func.count(func.distinct(func.date(Delivery.assigned_at))).label('cancelled_days')
        ).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "CANCELLED"
            )
        ).first()
        
        cancelled_shifts = cancelled_query.cancelled_days if cancelled_query else 0
        
        # This week shifts
        this_week_query = db.query(
            func.count(func.distinct(func.date(Delivery.assigned_at))).label('week_days')
        ).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(Delivery.assigned_at) >= week_start,
                func.date(Delivery.assigned_at) <= week_end
            )
        ).first()
        
        this_week_shifts = this_week_query.week_days if this_week_query else 0
        
        # Next week shifts
        next_week_query = db.query(
            func.count(func.distinct(func.date(Delivery.assigned_at))).label('next_week_days')
        ).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(Delivery.assigned_at) >= next_week_start,
                func.date(Delivery.assigned_at) <= next_week_end
            )
        ).first()
        
        next_week_shifts = next_week_query.next_week_days if next_week_query else 0
        
        # This month shifts
        this_month_query = db.query(
            func.count(func.distinct(func.date(Delivery.assigned_at))).label('month_days')
        ).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(Delivery.assigned_at) >= month_start,
                func.date(Delivery.assigned_at) <= month_end
            )
        ).first()
        
        this_month_shifts = this_month_query.month_days if this_month_query else 0
        
        # Calculate average shift hours (based on delivery assignments)
        avg_hours_query = db.query(
            func.avg(
                func.extract('hour', Delivery.assigned_at) +
                func.extract('minute', Delivery.assigned_at) / 60.0
            ).label('avg_start_hour'),
            func.avg(
                case(
                    (
                        Delivery.expected_delivery_time.isnot(None),
                        func.extract('hour', Delivery.expected_delivery_time) +
                        func.extract('minute', Delivery.expected_delivery_time) / 60.0
                    ),
                    else_=func.extract('hour', Delivery.assigned_at) +
                          func.extract('minute', Delivery.assigned_at) / 60.0 + 8.0
                )
            ).label('avg_end_hour')
        ).filter(
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        avg_start = avg_hours_query.avg_start_hour or 9.0
        avg_end = avg_hours_query.avg_end_hour or 17.0
        average_shift_hours = avg_end - avg_start
        
        if average_shift_hours < 0:
            average_shift_hours = 8.0  # Default to 8 hours
        
        # Determine preferred working days (most frequent delivery days)
        preferred_days_query = db.query(
            func.extract('dow', Delivery.assigned_at).label('day_of_week'),
            func.count(Delivery.delivery_id).label('delivery_count')
        ).filter(
            Delivery.delivery_person_id == delivery_person_id
        ).group_by(func.extract('dow', Delivery.assigned_at)
        ).order_by(desc('delivery_count')).limit(3).all()
        
        # Map PostgreSQL day_of_week (0=Sunday, 6=Saturday) to day names
        day_map = {
            0: "Sunday",
            1: "Monday", 
            2: "Tuesday",
            3: "Wednesday",
            4: "Thursday",
            5: "Friday",
            6: "Saturday"
        }
        
        preferred_working_days = []
        for day_num, count in preferred_days_query:
            if count > 0:  # Only include days with actual deliveries
                day_name = day_map.get(int(day_num))
                if day_name:
                    preferred_working_days.append(day_name)
        
        # Default if no data
        if not preferred_working_days:
            preferred_working_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        
        return {
            "total_assigned_shifts": total_assigned_shifts,
            "completed_shifts": completed_shifts,
            "upcoming_shifts": upcoming_shifts,
            "cancelled_shifts": cancelled_shifts,
            "this_week_shifts": this_week_shifts,
            "next_week_shifts": next_week_shifts,
            "this_month_shifts": this_month_shifts,
            "average_shift_hours": round(average_shift_hours, 1),
            "preferred_working_days": preferred_working_days
        }
    
    # ===== SHIFT DETAILS =====
    
    @staticmethod
    def get_shift_details(
        db: Session,
        delivery_person_id: int,
        shift_date: date
    ) -> Optional[Dict[str, Any]]:
        """Get detailed information for a specific shift date"""
        
        # Get all deliveries for this date
        deliveries = db.query(Delivery).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(Delivery.assigned_at) == shift_date
            )
        ).order_by(Delivery.assigned_at).all()
        
        if not deliveries:
            return None
        
        # Basic shift info
        first_delivery = deliveries[0]
        last_delivery = deliveries[-1]
        
        shift_start = first_delivery.assigned_at.replace(
            hour=9, minute=0, second=0
        )
        
        if last_delivery.expected_delivery_time:
            shift_end = last_delivery.expected_delivery_time.replace(
                hour=18, minute=0, second=0
            )
        else:
            shift_end = shift_start.replace(hour=18, minute=0, second=0)
        
        # Determine shift status
        today = date.today()
        current_time = datetime.utcnow()
        
        if shift_date < today:
            status = "completed"
        elif shift_date == today:
            if current_time > shift_end:
                status = "completed"
            elif current_time >= shift_start:
                status = "active"
            else:
                status = "assigned"
        else:
            status = "upcoming"
        
        # Get area info
        area_query = db.query(
            Area.area_name,
            City.city_name
        ).select_from(Delivery).join(
            Order, Order.order_id == Delivery.order_id
        ).join(
            Address, Address.address_id == Order.address_id
        ).join(
            Area, Area.area_id == Address.area_id
        ).join(
            City, City.city_id == Area.city_id
        ).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(Delivery.assigned_at) == shift_date
            )
        ).group_by(Area.area_name, City.city_name).first()
        
        if area_query:
            area_name, city_name = area_query
            location_info = {
                "name": area_name,
                "address": f"{area_name}, {city_name}",
                "zone": area_name
            }
        else:
            location_info = {
                "name": "Assigned Zone",
                "address": "Delivery Area",
                "zone": "Default Zone"
            }
        
        # Count deliveries by status
        deliveries_assigned = len(deliveries)
        deliveries_completed = len([d for d in deliveries if d.status == "DELIVERED"])
        deliveries_pending = deliveries_assigned - deliveries_completed
        
        # Calculate earnings
        earnings_query = db.query(
            func.sum(DeliveryEarnings.amount).label('total_earnings')
        ).join(Delivery).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(Delivery.assigned_at) == shift_date
            )
        ).first()
        
        actual_earnings = float(earnings_query.total_earnings) if earnings_query and earnings_query.total_earnings else None
        
        # Estimate base pay
        base_pay = deliveries_assigned * 100  # ₹100 per delivery
        
        # Calculate time tracking (for completed/active shifts)
        clock_in_time = None
        clock_out_time = None
        total_hours = None
        break_duration = None
        
        if status in ["completed", "active"] and first_delivery.assigned_at:
            clock_in_time = first_delivery.assigned_at
            
            if status == "completed" and last_delivery.delivered_at:
                clock_out_time = last_delivery.delivered_at
            elif status == "active":
                clock_out_time = current_time
            
            if clock_in_time and clock_out_time:
                total_hours = (clock_out_time - clock_in_time).total_seconds() / 3600
                # Assume 30-minute break for shifts over 6 hours
                if total_hours > 6:
                    break_duration = 30.0
                else:
                    break_duration = 0.0
        
        # Get performance metrics for completed shifts
        on_time_deliveries = None
        customer_rating = None
        
        if status == "completed":
            # Count on-time deliveries
            on_time_count = 0
            for delivery in deliveries:
                if (delivery.actual_delivery_time and delivery.expected_delivery_time and
                    delivery.actual_delivery_time <= delivery.expected_delivery_time + timedelta(minutes=30)):
                    on_time_count += 1
            
            if deliveries_completed > 0:
                on_time_deliveries = on_time_count
            
            # Get average rating for this day's deliveries
            from models.feedback.feedback import Feedback, FeedbackType
            rating_query = db.query(
                func.avg(Feedback.rating).label('avg_rating')
            ).join(Order).join(Delivery).filter(
                and_(
                    Delivery.delivery_person_id == delivery_person_id,
                    func.date(Delivery.assigned_at) == shift_date,
                    Feedback.feedback_type == FeedbackType.DELIVERY_FEEDBACK,
                    Feedback.rating.isnot(None)
                )
            ).first()
            
            if rating_query and rating_query.avg_rating:
                customer_rating = float(rating_query.avg_rating)
        
        return {
            "shift_id": hash(f"{delivery_person_id}_{shift_date}"),
            "date": shift_date,
            "time": {
                "start": shift_start.strftime("%H:%M"),
                "end": shift_end.strftime("%H:%M")
            },
            "location": location_info,
            "status": status,
            "assigned_at": first_delivery.assigned_at,
            "deliveries_assigned": deliveries_assigned,
            "deliveries_completed": deliveries_completed,
            "deliveries_pending": deliveries_pending,
            "base_pay": base_pay,
            "estimated_earnings": base_pay,
            "actual_earnings": actual_earnings,
            "clock_in_time": clock_in_time,
            "clock_out_time": clock_out_time,
            "total_hours": total_hours,
            "break_duration": break_duration,
            "on_time_deliveries": on_time_deliveries,
            "customer_rating": customer_rating
        }
    
    # ===== WORK PREFERENCES =====
    
    @staticmethod
    def get_work_preferences(
        db: Session,
        delivery_person_id: int
    ) -> Dict[str, Any]:
        """Get work preferences from delivery person record"""
        
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery_person:
            return {
                "preferred_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "preferred_start_time": "09:00",
                "preferred_end_time": "18:00",
                "max_hours_per_day": 8,
                "max_days_per_week": 6,
                "preferred_zones": [],
                "unavailable_dates": []
            }
        
        # Get preferred working days from actual delivery patterns
        preferred_days_query = db.query(
            func.extract('dow', Delivery.assigned_at).label('day_of_week'),
            func.count(Delivery.delivery_id).label('delivery_count')
        ).filter(
            Delivery.delivery_person_id == delivery_person_id
        ).group_by(func.extract('dow', Delivery.assigned_at)
        ).order_by(desc('delivery_count')).all()
        
        day_map = {
            0: "Sunday",
            1: "Monday", 
            2: "Tuesday",
            3: "Wednesday",
            4: "Thursday",
            5: "Friday",
            6: "Saturday"
        }
        
        preferred_days = []
        for day_num, count in preferred_days_query:
            if count > 5:  # Only include days with significant activity
                day_name = day_map.get(int(day_num))
                if day_name:
                    preferred_days.append(day_name)
        
        # Default if no strong pattern
        if not preferred_days:
            preferred_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        
        # Get average working hours
        avg_hours_query = db.query(
            func.avg(
                func.extract('hour', Delivery.assigned_at) +
                func.extract('minute', Delivery.assigned_at) / 60.0
            ).label('avg_start_hour'),
            func.avg(
                case(
                    (
                        Delivery.expected_delivery_time.isnot(None),
                        func.extract('hour', Delivery.expected_delivery_time) +
                        func.extract('minute', Delivery.expected_delivery_time) / 60.0
                    ),
                    else_=func.extract('hour', Delivery.assigned_at) +
                          func.extract('minute', Delivery.assigned_at) / 60.0 + 8.0
                )
            ).label('avg_end_hour')
        ).filter(
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        avg_start = avg_hours_query.avg_start_hour or 9.0
        avg_end = avg_hours_query.avg_end_hour or 17.0
        
        preferred_start_time = f"{int(avg_start):02d}:{int((avg_start % 1) * 60):02d}"
        preferred_end_time = f"{int(avg_end):02d}:{int((avg_end % 1) * 60):02d}"
        
        # Get preferred zones from delivery history
        zones_query = db.query(
            Area.area_name
        ).select_from(Delivery).join(
            Order, Order.order_id == Delivery.order_id
        ).join(
            Address, Address.address_id == Order.address_id
        ).join(
            Area, Area.area_id == Address.area_id
        ).filter(
            Delivery.delivery_person_id == delivery_person_id
        ).group_by(Area.area_name).order_by(
            func.count(Delivery.delivery_id).desc()
        ).limit(5).all()
        
        preferred_zones = [zone[0] for zone in zones_query] if zones_query else []
        
        # Get unavailable dates (dates with no deliveries when others have)
        # This is a simplified version - in reality, you'd track explicit unavailability
        unavailable_dates = []
        
        return {
            "preferred_days": preferred_days,
            "preferred_start_time": preferred_start_time,
            "preferred_end_time": preferred_end_time,
            "max_hours_per_day": 8,
            "max_days_per_week": 6,
            "preferred_zones": preferred_zones,
            "unavailable_dates": unavailable_dates,
            "last_updated": delivery_person.joined_at  # Using joined_at as proxy
        }