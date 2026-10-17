import React from 'react';
import './DateRangeFilter.css';

const DateRangeFilter = ({ dateRange, onDateRangeChange, onApply }) => {
    const handleStartDateChange = (e) => {
        onDateRangeChange({
            ...dateRange,
            startDate: e.target.value
        });
    };

    const handleEndDateChange = (e) => {
        onDateRangeChange({
            ...dateRange,
            endDate: e.target.value
        });
    };

    const handleQuickSelect = (days) => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        onDateRangeChange({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
    };

    const quickSelectOptions = [
        { label: 'Last 7 Days', days: 7 },
        { label: 'Last 30 Days', days: 30 },
        { label: 'Last 90 Days', days: 90 }
    ];

    return (
        <div className="flex flex-col md:flex-row gap-4 items-end bg-[var(--admin-bg-hover)] p-4 rounded-lg border border-[var(--admin-border)]">
            <div className="flex gap-2 w-full md:w-auto">
                <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase">Start Date</label>
                    <input
                        type="date"
                        className="admin-input h-[38px]"
                        value={dateRange.startDate}
                        onChange={handleStartDateChange}
                    />
                </div>

                <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase">End Date</label>
                    <input
                        type="date"
                        className="admin-input h-[38px]"
                        value={dateRange.endDate}
                        onChange={handleEndDateChange}
                    />
                </div>
            </div>

            <button
                onClick={onApply}
                className="admin-btn admin-btn-primary h-[38px] px-6"
            >
                Apply
            </button>

            <div className="hidden md:block w-px h-10 bg-[var(--admin-border)] mx-2"></div>

            <div className="flex gap-2 flex-wrap">
                {quickSelectOptions.map(option => (
                    <button
                        key={option.days}
                        onClick={() => handleQuickSelect(option.days)}
                        className="admin-btn admin-btn-secondary h-[38px] text-xs whitespace-nowrap"
                    >
                        {option.label}
                    </button>
                ))}
                <button
                    onClick={() => {
                        const today = new Date();
                        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                        onDateRangeChange({
                            startDate: firstDay.toISOString().split('T')[0],
                            endDate: today.toISOString().split('T')[0]
                        });
                    }}
                    className="admin-btn admin-btn-secondary h-[38px] text-xs whitespace-nowrap"
                >
                    This Month
                </button>
            </div>
        </div>
    );
};

export default DateRangeFilter;