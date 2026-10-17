import React from 'react';
import { ArrowLeft, BrainCircuit, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/Admin/Layout/AdminLayout';

const AISummary = () => {
    const navigate = useNavigate();

    return (
        <AdminLayout>
            <div className="dashboard-page min-h-screen p-8 animate-fade-in bg-[var(--admin-bg-main)]">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="p-2.5 bg-white border border-[var(--admin-border)] hover:bg-[var(--admin-bg-hover)] rounded-xl transition-all shadow-sm text-[var(--admin-text-secondary)]"
                        >
                            <ArrowLeft size={22} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-[var(--admin-text-primary)] tracking-tight">AI Executive Briefing</h1>
                            <p className="text-[var(--admin-text-secondary)] font-medium mt-1">Deep dive strategic analysis of your store's performance.</p>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6">

                        {/* 1. Overall Health Score */}
                        <section className="dashboard-card p-0 relative overflow-hidden border-indigo-200">
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-indigo-50/80 to-transparent opacity-70 pointer-events-none -mr-20 -mt-20"></div>

                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8 p-8">
                                <div className="p-5 bg-gradient-premium rounded-2xl shadow-xl shadow-indigo-200/50 flex-shrink-0">
                                    <BrainCircuit size={40} className="text-white" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-bold text-[var(--admin-text-primary)]">Store Health Status: <span className="text-[var(--admin-success)]">Excellent</span></h2>
                                        <span className="px-3 py-1 bg-[var(--admin-success-bg)] text-[var(--admin-success)] text-xs font-bold uppercase rounded-full tracking-wider">Top 15%</span>
                                    </div>
                                    <p className="text-[var(--admin-text-secondary)] leading-relaxed max-w-2xl text-lg">
                                        Based on trailing 30-day activity, revenue consistency has stabilized (+0.8 volatility score). Inventory turnover velocity has improved by <strong>12%</strong>, signaling higher demand efficiency.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 2. Detailed Breakdown Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Sales Insights */}
                            <div className="dashboard-card p-6 border-l-4 border-l-[var(--admin-success)]">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-2.5 bg-[var(--admin-success-bg)] rounded-xl text-[var(--admin-success)]">
                                        <TrendingUp size={22} />
                                    </div>
                                    <h3 className="text-lg font-bold text-[var(--admin-text-primary)]">Revenue Intelligence</h3>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex gap-4 text-[var(--admin-text-secondary)] group">
                                        <span className="w-2 h-2 rounded-full bg-[var(--admin-success)] mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></span>
                                        <p className="text-sm font-medium">Morning sales (9AM-12PM) have grown <span className="text-[var(--admin-success)] font-bold">22%</span> this week. Consider scheduling email blasts at 8:30 AM to capitalize on this trend.</p>
                                    </li>
                                    <li className="flex gap-4 text-[var(--admin-text-secondary)] group">
                                        <span className="w-2 h-2 rounded-full bg-[var(--admin-success)] mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></span>
                                        <p className="text-sm font-medium">Weekend retention is down slightly. A "Saturday Special" limited-time offer could recover an estimated <span className="text-[var(--admin-text-primary)] font-bold">~$500/week</span>.</p>
                                    </li>
                                </ul>
                            </div>

                            {/* Inventory Risks */}
                            <div className="dashboard-card p-6 border-l-4 border-l-[var(--admin-warning)]">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-2.5 bg-[var(--admin-warning-bg)] rounded-xl text-[var(--admin-warning)]">
                                        <AlertTriangle size={22} />
                                    </div>
                                    <h3 className="text-lg font-bold text-[var(--admin-text-primary)]">Supply Chain Risks</h3>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex gap-4 text-[var(--admin-text-secondary)] group">
                                        <span className="w-2 h-2 rounded-full bg-[var(--admin-warning)] mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></span>
                                        <p className="text-sm font-medium">"Wireless Headphones" stock is <span className="text-[var(--admin-warning)] font-bold">CRITICAL</span>. Projected stockout in 3 days based on current burn rate. Reorder immediately.</p>
                                    </li>
                                    <li className="flex gap-4 text-[var(--admin-text-secondary)] group">
                                        <span className="w-2 h-2 rounded-full bg-[var(--admin-warning)] mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></span>
                                        <p className="text-sm font-medium">Return rate for "Summer Tee" is 15% (High). Verify sizing chart accuracy compared to customer feedback logs.</p>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Customer Sentiment */}
                        <section className="dashboard-card p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-2.5 bg-[#F3E8FF] rounded-xl text-purple-600"> {/* Custom purple accent for now */}
                                    <Users size={22} />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--admin-text-primary)]">Customer Behavior Analysis</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                <div className="text-center p-6 bg-[var(--admin-bg-hover)] rounded-2xl border border-[var(--admin-border)]">
                                    <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">4.2%</div>
                                    <div className="text-xs font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">Conversion Rate</div>
                                </div>
                                <div className="text-center p-6 bg-[var(--admin-bg-hover)] rounded-2xl border border-[var(--admin-border)]">
                                    <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">$85</div>
                                    <div className="text-xs font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">Avg Cart Value</div>
                                </div>
                                <div className="text-center p-6 bg-[var(--admin-bg-hover)] rounded-2xl border border-[var(--admin-border)]">
                                    <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">28%</div>
                                    <div className="text-xs font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">Returning Customers</div>
                                </div>
                            </div>
                            <div className="text-center">
                                <button
                                    onClick={() => navigate('/admin/ai/chat')}
                                    className="text-[var(--admin-primary)] font-semibold hover:text-[var(--admin-primary-hover)] hover:underline flex items-center justify-center gap-2 mx-auto"
                                >
                                    Ask AI deep-dive questions about this data <ArrowLeft className="rotate-180" size={16} />
                                </button>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AISummary;
