import React from 'react';
import './DataTable.css';

const DataTable = ({ columns, data, keyField = 'id', onRowClick }) => {
    return (
        <div className="data-table-container overflow-x-auto">
            <table className="data-table min-w-full divide-y divide-gray-200">
                <thead className="table-header">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="header-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {column.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.map((row) => (
                        <tr 
                            key={row[keyField]} 
                            onClick={() => onRowClick && onRowClick(row)}
                            className={`table-row ${onRowClick ? 'clickable-row hover:bg-gray-50 cursor-pointer' : ''}`}
                        >
                            {columns.map((column) => (
                                <td key={column.key} className="table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;