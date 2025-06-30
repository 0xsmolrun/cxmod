import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { SearchFilters as SearchFiltersType, TicketStatus, Severity } from '../types/ticket';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TagInput } from './ui/TagInput';
import { GlassCard } from './ui/GlassCard';
import { useTickets } from '../hooks/useTickets';

interface SearchFiltersProps {
  onSearch: (filters: SearchFiltersType) => void;
  onClear: () => void;
}

const statusOptions = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'Reviewed by Dev', label: 'Reviewed by Dev' },
  { value: 'Waiting on Mod', label: 'Waiting on Mod' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'In Dev', label: 'In Dev' },
  { value: 'In QA', label: 'In QA' },
  { value: 'Waiting on User', label: 'Waiting on User' },
  { value: 'Under Review - Sumsub', label: 'Under Review - Sumsub' },
  { value: 'Under Review - Provenance', label: 'Under Review - Provenance' },
  { value: 'Under Review - Rain', label: 'Under Review - Rain' },
  { value: 'Under Review - Core Team', label: 'Under Review - Core Team' },
  { value: 'Resolved', label: 'Resolved' }
];

const severityOptions = [
  { value: 'SEV-1', label: 'SEV-1' },
  { value: 'SEV-2', label: 'SEV-2' },
  { value: 'SEV-3', label: 'SEV-3' },
  { value: 'SEV-4', label: 'SEV-4' },
  { value: 'SEV-5', label: 'SEV-5' }
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch, onClear }) => {
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [productSuggestions, setProductSuggestions] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const { getUniqueTagsFromMemory, tickets } = useTickets();

  useEffect(() => {
    // Load suggestions from memory (existing tickets)
    try {
      const products = getUniqueTagsFromMemory('product');
      const categories = getUniqueTagsFromMemory('category');
      
      setProductSuggestions(products);
      setCategorySuggestions(categories);
    } catch (error) {
      console.warn('Failed to load tag suggestions:', error);
    }
  }, [getUniqueTagsFromMemory, tickets]);

  const handleSearch = () => {
    // Clean up empty filters before sending
    const cleanFilters: SearchFiltersType = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) {
          cleanFilters[key as keyof SearchFiltersType] = value;
        } else if (!Array.isArray(value) && value) {
          cleanFilters[key as keyof SearchFiltersType] = value;
        }
      }
    });

    onSearch(cleanFilters);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
  };

  const updateFilter = (key: keyof SearchFiltersType, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      
      return newFilters;
    });
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof SearchFiltersType];
    return value && (Array.isArray(value) ? value.length > 0 : value);
  });

  const exportToCSV = () => {
    if (tickets.length === 0) {
      alert('No tickets to export');
      return;
    }

    const headers = [
      'Ticket ID',
      'Status',
      'Severity',
      'Issue Description',
      'Contact Info',
      'Product Tags',
      'Category Tags',
      'Core Team Comments',
      'Date Created',
      'Date Resolved'
    ];

    const csvContent = [
      headers.join(','),
      ...tickets.map(ticket => [
        `"${ticket.ticket_id}"`,
        `"${ticket.status}"`,
        `"${ticket.severity}"`,
        `"${ticket.issue_description.replace(/"/g, '""')}"`,
        `"${ticket.contact_info.replace(/"/g, '""')}"`,
        `"${ticket.product_tags.join('; ')}"`,
        `"${ticket.category_tags.join('; ')}"`,
        `"${ticket.core_team_comments.replace(/"/g, '""')}"`,
        `"${new Date(ticket.date_created).toLocaleDateString()}"`,
        `"${ticket.date_resolved ? new Date(ticket.date_resolved).toLocaleDateString() : ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tickets_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (tickets.length === 0) {
      alert('No tickets to export');
      return;
    }

    const jsonContent = JSON.stringify(tickets, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tickets_export_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <GlassCard className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Search & Filter</h3>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            icon={Download}
            onClick={exportToCSV}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Download}
            onClick={exportToJSON}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Export JSON</span>
            <span className="sm:hidden">JSON</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={showAdvanced ? ChevronUp : ChevronDown}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">{showAdvanced ? 'Hide Filters' : 'Show Filters'}</span>
            <span className="sm:hidden">Filters</span>
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-6">
          {/* Search Query */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <Input
              value={filters.search_query || ''}
              onChange={(value) => updateFilter('search_query', value)}
              placeholder="Search tickets by description, comments, contact info, or ticket ID..."
              className="w-full"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Status</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {statusOptions.map((option) => (
                <label key={option.value} className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(option.value as TicketStatus) || false}
                    onChange={(e) => {
                      const current = filters.status || [];
                      if (e.target.checked) {
                        updateFilter('status', [...current, option.value as TicketStatus]);
                      } else {
                        const newStatus = current.filter(s => s !== option.value);
                        updateFilter('status', newStatus);
                      }
                    }}
                    className="mr-3 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-tight">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Severity</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {severityOptions.map((option) => (
                <label key={option.value} className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.severity?.includes(option.value as Severity) || false}
                    onChange={(e) => {
                      const current = filters.severity || [];
                      if (e.target.checked) {
                        updateFilter('severity', [...current, option.value as Severity]);
                      } else {
                        const newSeverity = current.filter(s => s !== option.value);
                        updateFilter('severity', newSeverity);
                      }
                    }}
                    className="mr-3 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tag Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Tags</label>
              <TagInput
                value={filters.product_tags || []}
                onChange={(value) => updateFilter('product_tags', value)}
                suggestions={productSuggestions}
                placeholder="Type product tags..."
              />
              {productSuggestions.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {productSuggestions.length} existing product tag{productSuggestions.length !== 1 ? 's' : ''} available
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category Tags</label>
              <TagInput
                value={filters.category_tags || []}
                onChange={(value) => updateFilter('category_tags', value)}
                suggestions={categorySuggestions}
                placeholder="Type category tags..."
              />
              {categorySuggestions.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {categorySuggestions.length} existing category tag{categorySuggestions.length !== 1 ? 's' : ''} available
                </div>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={filters.date_range?.start || ''}
              onChange={(value) => updateFilter('date_range', { 
                ...filters.date_range, 
                start: value 
              })}
            />
            <Input
              label="End Date"
              type="date"
              value={filters.date_range?.end || ''}
              onChange={(value) => updateFilter('date_range', { 
                ...filters.date_range, 
                end: value 
              })}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              icon={Search}
              onClick={handleSearch}
              className="flex-1"
            >
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button
                variant="secondary"
                icon={X}
                onClick={handleClear}
                className="flex-1 sm:flex-none"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Export Info */}
      {tickets.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} available for export
        </div>
      )}
    </GlassCard>
  );
};