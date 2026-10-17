import React, { useState } from 'react';
import './DataTable.css'; // Added CSS import
import { FiChevronUp, FiChevronDown, FiFilter } from 'react-icons/fi';

const DataTable = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  sortable = true,
  className = ''
}) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterValues, setFilterValues] = useState({});

  const handleSort = (column) => {
    if (!sortable || !column.sortable) return;
    
    if (sortColumn === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (columnKey, value) => {
    setFilterValues(prev => ({ ...prev, [columnKey]: value }));
  };

  const filteredAndSortedData = React.useMemo(() => {
    let result = [...(data || [])];

    // Apply filters
    Object.entries(filterValues).forEach(([columnKey, filterValue]) => {
      if (filterValue && filterValue.trim() !== '') {
        const column = columns.find(col => col.key === columnKey);
        if (column && column.filterFn) {
          result = result.filter(item => 
            column.filterFn(item, filterValue)
          );
        } else {
          // Default filter behavior
          result = result.filter(item => {
            const value = item[columnKey];
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(filterValue.toLowerCase());
          });
        }
      }
    });

    // Apply sorting
    if (sortColumn) {
      const column = columns.find(col => col.key === sortColumn);
      if (column && column.sortFn) {
        result.sort((a, b) => {
          const comparison = column.sortFn(a, b);
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      } else {
        // Default sort behavior
        result.sort((a, b) => {
          const aValue = a[sortColumn];
          const bValue = b[sortColumn];
          
          if (aValue === bValue) return 0;
          if (aValue === null || aValue === undefined) return 1;
          if (bValue === null || bValue === undefined) return -1;
          
          const comparison = String(aValue).localeCompare(String(bValue));
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [data, columns, sortColumn, sortDirection, filterValues]);

  if (loading) {
    return (
      <div className="data-table-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasFilters = Object.values(filterValues).some(value => value && value.trim() !== '');

  return (
    <div className={`data-table-container ${className}`}>
      <table className="data-table">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'sortable cursor-pointer hover:bg-gray-100' : ''
                } ${sortColumn === column.key ? 'active' : ''}`}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center justify-between">
                  <span>{column.header}</span>
                  {column.sortable && (
                    <div className="ml-2 sort-icon">
                      {sortColumn === column.key ? (
                        sortDirection === 'asc' ? (
                          <FiChevronUp className="text-gray-400" />
                        ) : (
                          <FiChevronDown className="text-gray-400" />
                        )
                      ) : (
                        <div className="opacity-30">
                          <FiChevronUp className="text-gray-300" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {column.filterable && (
                  <div className="data-table-filter">
                    <input
                      type="text"
                      placeholder={`Filter ${column.header.toLowerCase()}...`}
                      value={filterValues[column.key] || ''}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredAndSortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="data-table-empty">
                {hasFilters ? 'No data matches your filters' : emptyMessage}
              </td>
            </tr>
          ) : (
            filteredAndSortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'clickable hover:bg-gray-50 transition-colors' : ''}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? column.render(row) : row[column.key] || ''}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="data-table-filters">
          <div className="data-table-filters-header">
            <div className="text-sm text-blue-700">
              Filtered: {filteredAndSortedData.length} of {data?.length || 0} records
            </div>
            <button
              onClick={() => setFilterValues({})}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear all filters
            </button>
          </div>
          <div className="data-table-filters-list">
            {Object.entries(filterValues).map(([key, value]) => {
              if (!value || value.trim() === '') return null;
              const column = columns.find(col => col.key === key);
              return (
                <span
                  key={key}
                  className="data-table-filter-tag"
                >
                  {column?.header || key}: {value}
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <FiFilter size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;