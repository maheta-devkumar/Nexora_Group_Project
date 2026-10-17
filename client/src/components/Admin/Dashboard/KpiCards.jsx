import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const KpiCards = ({ data }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
            {data.map((card, index) => (
                <div
                    key={card.id}
                    className="dashboard-card p-5 flex flex-col justify-between h-[120px] group hover:border-indigo-100"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide text-[11px]">{card.label}</span>
                        {card.alert ? (
                            <div className="p-1.5 bg-orange-50 rounded-lg text-orange-500">
                                <AlertCircle size={18} />
                            </div>
                        ) : card.trendUp ? (
                            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500">
                                <TrendingUp size={18} />
                            </div>
                        ) : (
                            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-500">
                                <TrendingDown size={18} />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-end justify-between">
                            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{card.value}</h3>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${card.trendUp
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : (card.alert ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-rose-50 text-rose-700 border-rose-100')
                                }`}>
                                {card.trend}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KpiCards;
