import React from 'react';
import { BrainCircuit, AlertTriangle, Lightbulb, MessageSquare, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AiInsights.css';

const AiInsights = ({ data }) => {
    const navigate = useNavigate();

    return (
        <div className="admin-ai-insights-card">
            {/* Background Decoration */}
            <div className="admin-ai-decoration-bg"></div>
            <div className="admin-ai-card-glow"></div>

            <div className="admin-ai-content">
                {/* Header / Actions */}
                <div className="admin-ai-header">
                    <div className="admin-ai-header-left">
                        <div className="admin-ai-icon-box">
                            <BrainCircuit size={22} className="text-white" />
                        </div>
                        <div className="admin-ai-title-group">
                            <h3>AI Executive Brief</h3>
                            <p className="admin-ai-subtitle">
                                <span className="admin-pulsing-dot">
                                    <span className="admin-pulsing-dot-ping"></span>
                                    <span className="admin-pulsing-dot-core"></span>
                                </span>
                                Real-time Intelligence
                            </p>
                        </div>
                    </div>
                    <div className="admin-ai-actions">
                        <button
                            onClick={() => navigate('/admin/ai/chat')}
                            className="admin-ai-btn admin-ai-btn-secondary"
                        >
                            <MessageSquare size={16} />
                            Ask AI
                        </button>
                        <button
                            onClick={() => navigate('/admin/ai/summary')}
                            className="admin-ai-btn admin-ai-btn-primary"
                        >
                            Full Report
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="admin-ai-grid">
                    {/* 1. Summary */}
                    <div className="space-y-4">
                        <h4 className="admin-ai-column-title">
                            <div className="admin-ai-column-indicator" style={{ backgroundColor: '#6366f1' }}></div>
                            Overview
                        </h4>
                        <p className="admin-ai-summary-text">
                            {data.summary}
                        </p>
                    </div>

                    {/* 2. Alerts */}
                    <div className="space-y-4">
                        <h4 className="admin-ai-column-title">
                            <div className="admin-ai-column-indicator" style={{ backgroundColor: '#f97316' }}></div>
                            Critical Attention
                        </h4>
                        <div className="space-y-3">
                            {data.alerts.map(alert => (
                                <div key={alert.id} className={`admin-ai-alert-item ${alert.type === 'critical' ? 'admin-ai-alert-critical' : 'admin-ai-alert-warning'}`}>
                                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                                    <span className="font-medium leading-snug">{alert.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Recommendations */}
                    <div className="space-y-4">
                        <h4 className="admin-ai-column-title">
                            <div className="admin-ai-column-indicator" style={{ backgroundColor: '#f59e0b' }}></div>
                            Recommended Actions
                        </h4>
                        <div className="space-y-3">
                            {data.recommendations.map(rec => (
                                <div key={rec.id} className="admin-ai-rec-item">
                                    <div className="admin-ai-rec-icon">
                                        <Lightbulb size={12} />
                                    </div>
                                    <span className="font-medium leading-snug">{rec.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiInsights;
