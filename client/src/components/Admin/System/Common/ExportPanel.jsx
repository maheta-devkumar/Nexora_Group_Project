import React, { useState } from 'react';
import './ExportPanel.css'; // Added CSS import
import { FiDownload, FiFile, FiFileText, FiSpreadsheet } from 'react-icons/fi';

const ExportPanel = ({
  data,
  filename = 'export',
  formats = ['csv', 'json', 'excel'],
  onExport,
  className = ''
}) => {
  const [exporting, setExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(formats[0]);

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: <FiFileText /> },
    { value: 'json', label: 'JSON', icon: <FiFile /> },
    { value: 'excel', label: 'Excel', icon: <FiSpreadsheet /> }
  ].filter(option => formats.includes(option.value));

  const handleExport = async () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    setExporting(true);
    
    try {
      if (onExport) {
        await onExport(selectedFormat, data);
      } else {
        // Default export implementation
        exportData(selectedFormat, data, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportData = (format, data, filename) => {
    let content, mimeType, extension;

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'csv':
        content = convertToCSV(data);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'excel':
        // For Excel, we'd typically use a library like xlsx
        // This is a simplified version that creates CSV (which Excel can open)
        content = convertToCSV(data);
        mimeType = 'application/vnd.ms-excel';
        extension = 'xls';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    // Get all unique keys from all objects
    const headers = [...new Set(data.flatMap(obj => Object.keys(obj)))];
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  return (
    <div className={`export-panel ${className}`}>
      <div className="export-panel-header">
        <div className="flex items-center space-x-4">
          <span className="export-label">Export Data:</span>
          
          <div className="export-format-selector">
            {formatOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedFormat(option.value)}
                disabled={exporting}
                className={`export-format-btn ${selectedFormat === option.value ? 'active' : ''}`}
              >
                <span className="icon">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || !data || data.length === 0}
          className={`export-btn ${exporting ? 'exporting' : ''}`}
        >
          <span className="icon"><FiDownload /></span>
          {exporting ? 'Exporting...' : 'Export'}
        </button>
      </div>

      <div className="export-info">
        <p>Exporting {data?.length || 0} records as {selectedFormat.toUpperCase()}</p>
        {data?.length === 0 && (
          <p className="error">No data available for export</p>
        )}
      </div>
    </div>
  );
};

export default ExportPanel;