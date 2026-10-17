import React from 'react';

const OperationalTables = ({ data }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

            {/* Low Stock Alerts Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[300px]">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Low Stock Products</h3>
                    <span className="text-xs text-blue-600 font-medium cursor-pointer">View All</span>
                </div>
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 bg-gray-50 uppercase sticky top-0">
                            <tr>
                                <th className="px-4 py-3 font-medium">Product</th>
                                <th className="px-4 py-3 font-medium">Stock</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.lowStock.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                                    <td className="px-4 py-3 text-red-600 font-bold">{item.stock}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Activity Log */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[300px]">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Recent Admin Activity</h3>
                </div>
                <div className="overflow-y-auto flex-1 p-4">
                    <div className="relative border-l border-gray-200 ml-2">
                        {data.recentActivity.map((log) => (
                            <div key={log.id} className="mb-4 ml-4">
                                <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white"></div>
                                <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{log.user} • {log.time}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default OperationalTables;
