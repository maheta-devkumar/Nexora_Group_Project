import React from 'react';
import { useAdminAI } from '../../context/AdminAIContext';

import './AdminAISummary.css';

const SummaryButton = ({ label, type, icon, colorClass }) => {
    const { generateSummary, loading } = useAdminAI();

    // Map tailwind color classes to CSS classes for specific button types
    let btnTypeClass = '';
    if (type === 'sales') btnTypeClass = 'btn-sales';
    else if (type === 'products') btnTypeClass = 'btn-products';
    else if (type === 'risks') btnTypeClass = 'btn-risks';
    else if (type === 'customers') btnTypeClass = 'btn-customers';
    else if (type === 'health') btnTypeClass = 'btn-health';

    return (
        <button
            onClick={() => generateSummary(type)}
            disabled={loading}
            className={`summary-btn ${btnTypeClass}`}
        >
            <span className="btn-icon">{icon}</span>
            <span className="btn-label">{label}</span>
        </button>
    );
};

const AdminAISummary = () => {
    return (
        <div className="ai-summary-container">
            <h2 className="summary-header">
                <span>⚡</span> Quick Insights
            </h2>
            <div className="summary-grid">
                <SummaryButton
                    label="Sales Performance"
                    type="sales"
                    icon="📈"
                />
                <SummaryButton
                    label="Top Products"
                    type="products"
                    icon="📦"
                />
                <SummaryButton
                    label="Risk Assessment"
                    type="risks"
                    icon="⚠️"
                />
                <SummaryButton
                    label="Customer Insights"
                    type="customers"
                    icon="👥"
                />
                <SummaryButton
                    label="Business Health"
                    type="health"
                    icon="🏥"
                />
            </div>
        </div>
    );
};

export default AdminAISummary;
