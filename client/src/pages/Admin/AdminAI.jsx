import React from 'react';
import { AdminAIProvider } from '../../context/AdminAIContext';
import AdminAISummary from '../../components/Admin/AdminAISummary';
import AdminAIChat from '../../components/Admin/AdminAIChat';

import AdminLayout from '../../components/Admin/Layout/AdminLayout';

import './AdminAI.css';

const AdminAIContent = () => {
    return (
        <AdminLayout>
            <div className="admin-ai-container">
                <div className="admin-ai-header">
                    <h1 className="admin-ai-title">AI Business Insights</h1>
                    <p className="admin-ai-subtitle">
                        Leverage artificial intelligence to analyze your store's performance, identify risks, and uncover opportunities.
                    </p>
                </div>

                <AdminAISummary />

                <div className="admin-ai-grid">
                    <div className="admin-ai-chat-column">
                        <AdminAIChat />
                    </div>

                    {/* Helper / Info Panel */}
                    <div className="admin-ai-info-panel">
                        <h3 className="info-title">Capabilities</h3>
                        <ul className="info-list">
                            <li className="info-item">
                                <span className="check-icon">✓</span>
                                <span>Analyze real-time sales trends</span>
                            </li>
                            <li className="info-item">
                                <span className="check-icon">✓</span>
                                <span>Summarize product performance</span>
                            </li>
                            <li className="info-item">
                                <span className="check-icon">✓</span>
                                <span>Identify inventory and stock risks</span>
                            </li>
                            <li className="info-item">
                                <span className="check-icon">✓</span>
                                <span>Provide customer insights</span>
                            </li>
                        </ul>

                        <div className="info-footer">
                            <h4 className="footer-title">Try asking:</h4>
                            <div className="example-prompts">
                                <p>"Why is revenue down today?"</p>
                                <p>"Which products should I restock?"</p>
                                <p>"Who are my top 3 customers?"</p>
                                <p>"Give me a summary of last week's sales."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

const AdminAI = () => {
    return (
        <AdminAIProvider>
            <AdminAIContent />
        </AdminAIProvider>
    );
};

export default AdminAI;
