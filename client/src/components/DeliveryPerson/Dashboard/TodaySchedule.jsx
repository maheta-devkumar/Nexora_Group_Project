import React, { useEffect } from 'react';
import './TodaySchedule.css';
import {
  Clock,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useDeliveryDashboardContext } from '../../../context/DeliveryPersonDashboardContext';

const TodaySchedule = () => {
  const { todaySchedule, loading, fetchTodaySchedule, addLog } = useDeliveryDashboardContext();

  useEffect(() => {
    if (!todaySchedule) {
      fetchTodaySchedule();
    }
  }, [todaySchedule, fetchTodaySchedule]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'ongoing':
        return <Clock size={16} className="dp-status-icon ongoing" />;
      case 'completed':
        return <CheckCircle size={16} className="dp-status-icon completed" />;
      case 'upcoming':
        return <AlertCircle size={16} className="dp-status-icon upcoming" />;
      default:
        return <AlertCircle size={16} className="dp-status-icon upcoming" />;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'ongoing': return 'Ongoing';
      case 'completed': return 'Completed';
      case 'upcoming': return 'Upcoming';
      default: return 'Scheduled';
    }
  };

  if (loading && !todaySchedule) {
    return (
      <div className="dp-today-schedule loading">
        <div className="dp-schedule-header">
          <div className="dp-header-left">
            <div className="dp-loading-icon"></div>
            <div className="dp-loading-line medium"></div>
          </div>
          <div className="dp-current-date dp-loading-line small"></div>
        </div>

        <div className="dp-next-delivery">
          <div className="dp-next-delivery-header">
            <div className="dp-loading-line medium"></div>
            <div className="dp-delivery-time dp-loading-line small"></div>
          </div>
        </div>

        <div className="dp-shifts-list">
          <div className="dp-loading-line medium"></div>
          <div className="dp-timeline">
            {[1, 2].map((i) => (
              <div key={i} className="dp-timeline-item">
                <div className="dp-timeline-marker">
                  <div className="dp-loading-icon small"></div>
                </div>
                <div className="dp-timeline-content">
                  <div className="dp-loading-line"></div>
                  <div className="dp-loading-line small"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!todaySchedule) {
    return (
      <div className="dp-today-schedule">
        <div className="dp-schedule-header">
          <div className="dp-header-left">
            <Calendar size={20} />
            <h3>Today's Schedule</h3>
          </div>
          <span className="dp-current-date">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
        <div className="dp-no-data">
          <p>No schedule data available.</p>
          <button onClick={fetchTodaySchedule} className="dp-retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dp-today-schedule">
      <div className="dp-schedule-header">
        <div className="dp-header-left">
          <Calendar size={20} />
          <h3>Today's Schedule</h3>
        </div>
        <span className="dp-current-date">{todaySchedule.date}</span>
      </div>

      <div className="dp-next-delivery">
        <div className="dp-next-delivery-header">
          <h4>Next Delivery</h4>
          {todaySchedule.next_delivery?.time && todaySchedule.next_delivery.time !== 'N/A' && (
            <span className="dp-delivery-time">
              <Clock size={14} />
              {todaySchedule.next_delivery.time}
            </span>
          )}
        </div>

        {todaySchedule.next_delivery && todaySchedule.next_delivery.id !== 'No deliveries' ? (
          <div className="dp-delivery-details">
            <div className="dp-delivery-id">
              <strong>#{todaySchedule.next_delivery.id}</strong>
              <span>{todaySchedule.next_delivery.customer}</span>
            </div>

            <div className="dp-delivery-info">
              <MapPin size={14} />
              <span>{todaySchedule.next_delivery.address}</span>
            </div>

            <div className="dp-delivery-distance">
              <span>{todaySchedule.next_delivery.distance} away</span>
            </div>
          </div>
        ) : (
          <div className="dp-no-next-delivery">
            <p>No upcoming deliveries scheduled</p>
          </div>
        )}
      </div>

      <div className="dp-shifts-list">
        <h4>Today's Shifts</h4>

        {todaySchedule.upcoming_shifts?.length > 0 ? (
          <div className="dp-timeline">
            {todaySchedule.upcoming_shifts.map((shift, index) => (
              <div
                key={shift.id}
                className={`dp-timeline-item ${shift.type} ${shift.status}`}
              >
                <div className="dp-timeline-marker">
                  {getStatusIcon(shift.status)}
                </div>

                <div className="dp-timeline-content">
                  <div className="dp-shift-header">
                    <div className="dp-shift-title">
                      <strong>{shift.title}</strong>
                      <span className="dp-shift-time">{shift.time}</span>
                    </div>
                    <span className={`dp-shift-status ${shift.status}`}>
                      {getStatusText(shift.status)}
                    </span>
                  </div>

                  {shift.location && (
                    <div className="dp-shift-location">
                      <MapPin size={14} />
                      <span>{shift.location}</span>
                    </div>
                  )}

                  {shift.completedTasks !== undefined && shift.totalTasks !== undefined && (
                    <div className="dp-shift-progress">
                      <div className="dp-progress-bar">
                        <div
                          className="dp-progress-fill"
                          style={{
                            width: `${(shift.completedTasks / shift.totalTasks) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="dp-progress-text">
                        {shift.completedTasks}/{shift.totalTasks} tasks completed
                      </span>
                    </div>
                  )}

                  {shift.scheduledDeliveries && (
                    <div className="dp-shift-deliveries">
                      <span>{shift.scheduledDeliveries} deliveries scheduled</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="dp-no-shifts">
            <p>No shifts scheduled for today</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaySchedule;
