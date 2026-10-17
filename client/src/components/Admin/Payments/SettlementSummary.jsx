import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const SettlementSummary = ({ data }) => {
    return (
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-xl shadow-lg p-6 text-white h-full relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-white opacity-10"></div>
            <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-16 h-16 rounded-full bg-white opacity-10"></div>

            <h3 className="text-lg font-semibold text-indigo-100 mb-6 relative z-10">Settlement Summary</h3>

            <div className="space-y-6 relative z-10">
                <div>
                    <p className="text-sm text-indigo-300 mb-1">Total Settled</p>
                    <div className="text-3xl font-bold">{data.totalSettled}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-500 border-opacity-30">
                    <div>
                        <p className="text-xs text-indigo-300 mb-1">Pending</p>
                        <div className="text-lg font-semibold">{data.pendingSettlement}</div>
                    </div>
                    <div>
                        <p className="text-xs text-indigo-300 mb-1">Gateway Fees</p>
                        <div className="text-lg font-semibold">{data.gatewayFees}</div>
                    </div>
                </div>

                <div className="pt-2">
                    <button className="w-full bg-white text-indigo-800 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                        View Settlement Report
                        <ArrowUpRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettlementSummary;
