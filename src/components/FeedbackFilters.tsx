import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { FeedbackSearchFilters, Platform } from '../types/feedback';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { GlassCard } from './ui/GlassCard';
import { useFeedback } from '../hooks/useFeedback';

interface FeedbackFiltersProps {
  onSearch: (filters: FeedbackSearchFilters) => void;
  onClear: () => void;
}

const platformOptions = [
  { value: 'Intercom', label: 'Intercom' },
  { value: 'Discord', label: 'Discord' },
  { value: 'X', label: 'X (Twitter)' },
  { value: 'Zoom (Analyst Call)', label: 'Zoom (Analyst Call)' }
];

export const FeedbackFilters: React.FC<FeedbackFiltersProps> = ({ onSearch, onClear }) => {
  const [filters, setFilters] = useState<FeedbackSearchFilters>({});
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [productSuggestions, setProductSuggestions] = useState<string[]>([]);
  const { getUniqueProductsFromMemory, feedback } = useFeedback();

  useEffect(() => {
    // Load suggestions from memory (existing feedback)
    try {
      const products = getUniqueProductsFromMemory();
      setProductSuggestions(products);
    } catch (error) {
      console.warn('Failed to load product suggestions:', error);
    }
  }, [getUniqueProductsFromMemory, feedback]);

  const handleSearch = () => {
    // Clean up empty filters before sending
    const cleanFilters: FeedbackSearchFilters = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) {
          cleanFilters[key as keyof FeedbackSearchFilters] = value;
        } else if (!Array.isArray(value) && value !== '') {
          cleanFilters[key as keyof FeedbackSearchFilters] = value;
        }
      }
    });

    onSearch(cleanFilters);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
  };

  const updateFilter = (key: keyof FeedbackSearchFilters, value: any) => {
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
    const value = filters[key as keyof FeedbackSearchFilters];
    return value && (Array.isArray(value) ? value.length > 0 : value);
  });

  const exportToCSV = () => {
    if (feedback.length === 0) {
      alert('No feedback to export');
      return;
    }

    const headers = [
      'ID',
      'Ticket ID',
      'Platform',
      'Product',
      'Description',
      'Core Team Acknowledgement',
      'Shipped',
      'Date Created',
      'Shipping Date'
    ];

    const csvContent = [
      headers.join(','),
      ...feedback.map(item => [
        `"${item.id}"`,
        `"${item.ticket_id || ''}"`,
        `"${item.platform}"`,
        `"${item.product || ''}"`,
        `"${(item.description || '').replace(/"/g, '""')}"`,
        `"${item.core_team_acknowledgement === null ? '' : item.core_team_acknowledgement ? 'TRUE' : 'FALSE'}"`,
        `"${item.shipped === null ? '' : item.shipped ? 'TRUE' : 'FALSE'}"`,
        `"${new Date(item.created_at).toLocaleDateString()}"`,
        `"${item.shipping_date ? new Date(item.shipping_date).toLocaleDateString() : ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `feedback_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (feedback.length === 0) {
      alert('No feedback to export');
      return;
    }

    const jsonContent = JSON.stringify(feedback, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `feedback_export_${new Date().toISOString().split('T')[0]}.json`);
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
              placeholder="Search feedback by description, product, or ticket ID..."
              className="w-full"
            />
          </div>

          {/* Platform Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Platform</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {platformOptions.map((option) => (
                <label key={option.value} className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.platform?.includes(option.value as Platform) || false}
                    onChange={(e) => {
                      const current = filters.platform || [];
                      if (e.target.checked) {
                        updateFilter('platform', [...current, option.value as Platform]);
                      } else {
                        const newPlatforms = current.filter(p => p !== option.value);
                        updateFilter('platform', newPlatforms);
                      }
                    }}
                    className="mr-3 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-tight">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Product Filter */}
          {productSuggestions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Product</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {productSuggestions.map((product) => (
                  <label key={product} className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.product?.includes(product) || false}
                      onChange={(e) => {
                        const current = filters.product || [];
                        if (e.target.checked) {
                          updateFilter('product', [...current, product]);
                        } else {
                          const newProducts = current.filter(p => p !== product);
                          updateFilter('product', newProducts);
                        }
                      }}
                      className="mr-3 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-tight">{product}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Boolean Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Core Team Acknowledgement</label>
              <div className="space-y-2">
                <label className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    name="acknowledgement"
                    checked={filters.core_team_acknowledgement === true}
                    onChange={() => updateFilter('core_team_acknowledgement', true)}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">TRUE</span>
                </label>
                <label className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    name="acknowledgement"
                    checked={filters.core_team_acknowledgement === false}
                    onChange={() => updateFilter('core_team_acknowledgement', false)}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">FALSE</span>
                </label>
                <label className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    name="acknowledgement"
                    checked={filters.core_team_acknowledgement === undefined}
                    onChange={() => updateFilter('core_team_acknowledgement', undefined)}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">All</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Shipped Status</label>
              <div className="space-y-2">
                <label className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    name="shipped"
                    checked={filters.shipped === true}
                    onChange={() => updateFilter('shipped', true)}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">TRUE</span>
                </label>
                <label className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    name="shipped"
                    checked={filters.shipped === false}
                    onChange={() => updateFilter('shipped', false)}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">FALSE</span>
                </label>
                <label className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    name="shipped"
                    checked={filters.shipped === undefined}
                    onChange={() => updateFilter('shipped', undefined)}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">All</span>
                </label>
              </div>
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
      {feedback.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          {feedback.length} feedback item{feedback.length !== 1 ? 's' : ''} available for export
        </div>
      )}
    </GlassCard>
  );
};