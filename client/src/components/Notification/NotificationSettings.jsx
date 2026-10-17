import React, { useState, useEffect } from 'react';
import './NotificationSettings.css';

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState({
    order_updates: true,
    delivery_updates: true,
    promotional_offers: true,
    price_drop_alerts: false,
    back_in_stock_alerts: false,
    new_arrivals: false,
    email_notifications: true,
    push_notifications: true
  });

  const [frequency, setFrequency] = useState('instant');
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: '22:00',
    end: '08:00'
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const savedPreferences = localStorage.getItem('notification_preferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }

    const savedFrequency = localStorage.getItem('notification_frequency');
    if (savedFrequency) {
      setFrequency(savedFrequency);
    }

    const savedQuietHours = localStorage.getItem('notification_quiet_hours');
    if (savedQuietHours) {
      setQuietHours(JSON.parse(savedQuietHours));
    }
  }, []);

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFrequencyChange = (value) => {
    setFrequency(value);
  };

  const handleQuietHoursToggle = () => {
    setQuietHours(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const handleQuietHoursChange = (field, value) => {
    setQuietHours(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Save to localStorage (in real app, save to backend)
    localStorage.setItem('notification_preferences', JSON.stringify(preferences));
    localStorage.setItem('notification_frequency', frequency);
    localStorage.setItem('notification_quiet_hours', JSON.stringify(quietHours));
    
    setIsSaving(false);
    
    // Show success message
    alert('Notification preferences saved successfully!');
  };

  const handleReset = () => {
    setPreferences({
      order_updates: true,
      delivery_updates: true,
      promotional_offers: true,
      price_drop_alerts: false,
      back_in_stock_alerts: false,
      new_arrivals: false,
      email_notifications: true,
      push_notifications: true
    });
    setFrequency('instant');
    setQuietHours({
      enabled: false,
      start: '22:00',
      end: '08:00'
    });
  };

  return (
    <div className="notification-settings">
      <div className="settings-header">
        <h2 className="settings-title">Notification Preferences</h2>
        <p className="settings-subtitle">Customize how and when you receive notifications</p>
      </div>

      <div className="settings-content">
        {/* Notification Types */}
        <div className="settings-section">
          <h3 className="section-title">Notification Types</h3>
          <p className="section-subtitle">Choose which types of notifications you want to receive</p>
          
          <div className="preferences-grid">
            <div className="preference-item">
              <div className="preference-info">
                <i className="fas fa-box preference-icon order"></i>
                <div>
                  <h4>Order Updates</h4>
                  <p>Order confirmations, shipping updates, delivery alerts</p>
                </div>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="order_updates"
                  checked={preferences.order_updates}
                  onChange={() => handleToggle('order_updates')}
                />
                <label htmlFor="order_updates"></label>
              </div>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <i className="fas fa-truck preference-icon delivery"></i>
                <div>
                  <h4>Delivery Updates</h4>
                  <p>Real-time delivery tracking and updates</p>
                </div>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="delivery_updates"
                  checked={preferences.delivery_updates}
                  onChange={() => handleToggle('delivery_updates')}
                />
                <label htmlFor="delivery_updates"></label>
              </div>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <i className="fas fa-tag preference-icon offer"></i>
                <div>
                  <h4>Promotional Offers</h4>
                  <p>Special discounts, coupons, and sales alerts</p>
                </div>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="promotional_offers"
                  checked={preferences.promotional_offers}
                  onChange={() => handleToggle('promotional_offers')}
                />
                <label htmlFor="promotional_offers"></label>
              </div>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <i className="fas fa-chart-line preference-icon price"></i>
                <div>
                  <h4>Price Drop Alerts</h4>
                  <p>Get notified when prices drop on watched items</p>
                </div>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="price_drop_alerts"
                  checked={preferences.price_drop_alerts}
                  onChange={() => handleToggle('price_drop_alerts')}
                />
                <label htmlFor="price_drop_alerts"></label>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Methods */}
        <div className="settings-section">
          <h3 className="section-title">Delivery Methods</h3>
          
          <div className="delivery-methods">
            <div className="method-item">
              <div className="method-info">
                <i className="fas fa-envelope method-icon"></i>
                <div>
                  <h4>Email Notifications</h4>
                  <p>Receive notifications via email</p>
                </div>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="email_notifications"
                  checked={preferences.email_notifications}
                  onChange={() => handleToggle('email_notifications')}
                />
                <label htmlFor="email_notifications"></label>
              </div>
            </div>

            <div className="method-item">
              <div className="method-info">
                <i className="fas fa-bell method-icon"></i>
                <div>
                  <h4>Push Notifications</h4>
                  <p>Receive browser/app push notifications</p>
                </div>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="push_notifications"
                  checked={preferences.push_notifications}
                  onChange={() => handleToggle('push_notifications')}
                />
                <label htmlFor="push_notifications"></label>
              </div>
            </div>
          </div>
        </div>

        {/* Frequency Settings */}
        <div className="settings-section">
          <h3 className="section-title">Frequency Settings</h3>
          
          <div className="frequency-options">
            {['instant', 'daily', 'weekly'].map((option) => (
              <div 
                key={option}
                className={`frequency-option ${frequency === option ? 'active' : ''}`}
                onClick={() => handleFrequencyChange(option)}
              >
                <div className="option-radio">
                  <div className={`radio-dot ${frequency === option ? 'active' : ''}`}></div>
                </div>
                <div className="option-content">
                  <h4>{option.charAt(0).toUpperCase() + option.slice(1)}</h4>
                  <p>
                    {option === 'instant' && 'Receive notifications immediately'}
                    {option === 'daily' && 'Get a daily digest of notifications'}
                    {option === 'weekly' && 'Get a weekly summary of notifications'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="settings-section">
          <div className="quiet-hours-header">
            <div>
              <h3 className="section-title">Quiet Hours</h3>
              <p className="section-subtitle">Pause notifications during specific hours</p>
            </div>
            <div className="toggle-switch large">
              <input
                type="checkbox"
                id="quiet_hours"
                checked={quietHours.enabled}
                onChange={handleQuietHoursToggle}
              />
              <label htmlFor="quiet_hours"></label>
            </div>
          </div>

          {quietHours.enabled && (
            <div className="quiet-hours-controls">
              <div className="time-selector">
                <label>From</label>
                <input
                  type="time"
                  value={quietHours.start}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                />
              </div>
              <div className="time-separator">to</div>
              <div className="time-selector">
                <label>To</label>
                <input
                  type="time"
                  value={quietHours.end}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="settings-actions">
          <button 
            className="save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="save-spinner"></div>
                Saving...
              </>
            ) : 'Save Preferences'}
          </button>
          
          <button 
            className="reset-btn"
            onClick={handleReset}
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;