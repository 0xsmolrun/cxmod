import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Grid, List, Filter, CheckSquare } from 'lucide-react';
import { Feedback, Platform } from '../types/feedback';
import { FeedbackCard } from './FeedbackCard';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Select } from './ui/Select';
import { Checkbox } from './ui/Checkbox';
import { BulkActions } from './BulkActions';

interface FeedbackGalleryProps {
  feedback: Feedback[];
  onEdit: (feedback: Feedback) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  loading?: boolean;
}

const ITEMS_PER_PAGE = 12;

const sortOptions = [
  { value: 'date_desc', label: 'Date Created (Newest First)' },
  { value: 'date_asc', label: 'Date Created (Oldest First)' },
  { value: 'platform', label: 'Platform' },
  { value: 'product', label: 'Product' },
  { value: 'shipped', label: 'Shipped Status' },
  { value: 'acknowledged', label: 'Acknowledgement Status' }
];

const viewModes = [
  { value: 'grid', label: 'Grid', icon: Grid },
  { value: 'list', label: 'List', icon: List }
];

export const FeedbackGallery: React.FC<FeedbackGalleryProps> = ({
  feedback,
  onEdit,
  onDelete,
  onBulkDelete,
  loading = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFeedback, setSelectedFeedback] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Sort feedback
  const processedFeedback = useMemo(() => {
    const sorted = [...feedback].sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'platform':
          return a.platform.localeCompare(b.platform);
        case 'product':
          return (a.product || '').localeCompare(b.product || '');
        case 'shipped':
          if (a.shipped === b.shipped) return 0;
          return a.shipped ? -1 : 1;
        case 'acknowledged':
          if (a.core_team_acknowledgement === b.core_team_acknowledgement) return 0;
          return a.core_team_acknowledgement ? -1 : 1;
        default:
          return 0;
      }
    });

    return sorted;
  }, [feedback, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedFeedback.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentFeedback = processedFeedback.slice(startIndex, endIndex);

  // Reset to first page when sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  // Reset to first page when feedback changes (from filters)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [feedback.length]);

  // Clear selection when bulk mode is disabled
  React.useEffect(() => {
    if (!bulkMode) {
      setSelectedFeedback(new Set());
    }
  }, [bulkMode]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectFeedback = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedFeedback);
    if (selected) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedFeedback(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFeedback(new Set(currentFeedback.map(f => f.id)));
    } else {
      setSelectedFeedback(new Set());
    }
  };

  const handleBulkDelete = () => {
    onBulkDelete(Array.from(selectedFeedback));
    setSelectedFeedback(new Set());
  };

  const handleBulkExport = () => {
    const selectedFeedbackData = feedback.filter(f => selectedFeedback.has(f.id));
    
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
      ...selectedFeedbackData.map(item => [
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
    link.setAttribute('download', `selected_feedback_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allCurrentSelected = currentFeedback.length > 0 && currentFeedback.every(f => selectedFeedback.has(f.id));
  const someCurrentSelected = currentFeedback.some(f => selectedFeedback.has(f.id));

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={ChevronLeft}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2"
          >
            <span className="hidden sm:inline">Previous</span>
          </Button>
          
          {startPage > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(1)}
              >
                1
              </Button>
              {startPage > 2 && <span className="text-gray-400">...</span>}
            </>
          )}
          
          {pages.map(page => (
            <Button
              key={page}
              variant={page === currentPage ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            icon={ChevronRight}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2"
          >
            <span className="hidden sm:inline">Next</span>
          </Button>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Actions */}
      {bulkMode && (
        <BulkActions
          selectedCount={selectedFeedback.size}
          onClearSelection={() => setSelectedFeedback(new Set())}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
          type="feedback"
        />
      )}

      {/* Gallery Controls */}
      <GlassCard>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
                className="w-full sm:w-auto min-w-[200px]"
              />
              
              {currentFeedback.length > 0 && (
                <Button
                  variant={bulkMode ? 'primary' : 'ghost'}
                  size="sm"
                  icon={CheckSquare}
                  onClick={() => setBulkMode(!bulkMode)}
                >
                  Bulk Actions
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {viewModes.map(mode => (
                <Button
                  key={mode.value}
                  variant={viewMode === mode.value ? 'primary' : 'ghost'}
                  size="sm"
                  icon={mode.icon}
                  onClick={() => setViewMode(mode.value as 'grid' | 'list')}
                  className="flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">{mode.label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, processedFeedback.length)} of {processedFeedback.length} feedback items
              {selectedFeedback.size > 0 && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  ({selectedFeedback.size} selected)
                </span>
              )}
            </div>
            
            {bulkMode && currentFeedback.length > 0 && (
              <Checkbox
                checked={allCurrentSelected}
                onChange={handleSelectAll}
                label={`Select all ${currentFeedback.length} on this page`}
                className="text-sm"
              />
            )}
          </div>
        </div>
      </GlassCard>

      {/* Feedback Display */}
      {currentFeedback.length > 0 ? (
        <>
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6"
              : "space-y-4"
          }>
            {currentFeedback.map((item) => (
              <FeedbackCard
                key={item.id}
                feedback={item}
                onEdit={onEdit}
                onDelete={onDelete}
                compact={viewMode === 'list'}
                selectable={bulkMode}
                selected={selectedFeedback.has(item.id)}
                onSelect={handleSelectFeedback}
              />
            ))}
          </div>
          
          {renderPagination()}
        </>
      ) : (
        <GlassCard className="text-center py-12">
          <Filter className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No feedback found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            No feedback items match your current filter criteria.
          </p>
        </GlassCard>
      )}
    </div>
  );
};