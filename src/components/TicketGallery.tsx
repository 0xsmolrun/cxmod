import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Grid, List, Filter, CheckSquare } from 'lucide-react';
import { Ticket, TicketStatus } from '../types/ticket';
import { TicketCard } from './TicketCard';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Select } from './ui/Select';
import { Checkbox } from './ui/Checkbox';
import { BulkActions } from './BulkActions';

interface TicketGalleryProps {
  tickets: Ticket[];
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkStatusUpdate: (ids: string[], status: TicketStatus) => void;
  loading?: boolean;
}

const ITEMS_PER_PAGE = 12;

const sortOptions = [
  { value: 'ticket_id_desc', label: 'Ticket ID (Newest First)' },
  { value: 'ticket_id_asc', label: 'Ticket ID (Oldest First)' },
  { value: 'date_desc', label: 'Date Created (Newest First)' },
  { value: 'date_asc', label: 'Date Created (Oldest First)' },
  { value: 'status', label: 'Status' },
  { value: 'severity', label: 'Severity' }
];

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

const viewModes = [
  { value: 'grid', label: 'Grid', icon: Grid },
  { value: 'list', label: 'List', icon: List }
];

export const TicketGallery: React.FC<TicketGalleryProps> = ({
  tickets,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkStatusUpdate,
  loading = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('ticket_id_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Sort tickets
  const processedTickets = useMemo(() => {
    const sorted = [...tickets].sort((a, b) => {
      switch (sortBy) {
        case 'ticket_id_desc':
          return (parseInt(b.ticket_id) || 0) - (parseInt(a.ticket_id) || 0);
        case 'ticket_id_asc':
          return (parseInt(a.ticket_id) || 0) - (parseInt(b.ticket_id) || 0);
        case 'date_desc':
          return new Date(b.date_created).getTime() - new Date(a.date_created).getTime();
        case 'date_asc':
          return new Date(a.date_created).getTime() - new Date(b.date_created).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'severity':
          const severityOrder = { 'SEV-1': 1, 'SEV-2': 2, 'SEV-3': 3, 'SEV-4': 4, 'SEV-5': 5 };
          return (severityOrder[a.severity] || 6) - (severityOrder[b.severity] || 6);
        default:
          return 0;
      }
    });

    return sorted;
  }, [tickets, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedTickets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTickets = processedTickets.slice(startIndex, endIndex);

  // Reset to first page when sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  // Reset to first page when tickets change (from filters)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [tickets.length]);

  // Clear selection when bulk mode is disabled
  React.useEffect(() => {
    if (!bulkMode) {
      setSelectedTickets(new Set());
    }
  }, [bulkMode]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTicket = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedTickets);
    if (selected) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedTickets(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(new Set(currentTickets.map(t => t.id)));
    } else {
      setSelectedTickets(new Set());
    }
  };

  const handleBulkDelete = () => {
    onBulkDelete(Array.from(selectedTickets));
    setSelectedTickets(new Set());
  };

  const handleBulkStatusUpdate = (status: string) => {
    onBulkStatusUpdate(Array.from(selectedTickets), status as TicketStatus);
    setSelectedTickets(new Set());
  };

  const handleBulkExport = () => {
    const selectedTicketData = tickets.filter(t => selectedTickets.has(t.id));
    
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
      ...selectedTicketData.map(ticket => [
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
    link.setAttribute('download', `selected_tickets_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allCurrentSelected = currentTickets.length > 0 && currentTickets.every(t => selectedTickets.has(t.id));
  const someCurrentSelected = currentTickets.some(t => selectedTickets.has(t.id));

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
          selectedCount={selectedTickets.size}
          onClearSelection={() => setSelectedTickets(new Set())}
          onBulkDelete={handleBulkDelete}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onBulkExport={handleBulkExport}
          statusOptions={statusOptions}
          type="tickets"
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
              
              {currentTickets.length > 0 && (
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
              Showing {startIndex + 1}-{Math.min(endIndex, processedTickets.length)} of {processedTickets.length} tickets
              {selectedTickets.size > 0 && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  ({selectedTickets.size} selected)
                </span>
              )}
            </div>
            
            {bulkMode && currentTickets.length > 0 && (
              <Checkbox
                checked={allCurrentSelected}
                onChange={handleSelectAll}
                label={`Select all ${currentTickets.length} on this page`}
                className="text-sm"
              />
            )}
          </div>
        </div>
      </GlassCard>

      {/* Tickets Display */}
      {currentTickets.length > 0 ? (
        <>
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6"
              : "space-y-4"
          }>
            {currentTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onEdit={onEdit}
                onDelete={onDelete}
                compact={viewMode === 'list'}
                selectable={bulkMode}
                selected={selectedTickets.has(ticket.id)}
                onSelect={handleSelectTicket}
              />
            ))}
          </div>
          
          {renderPagination()}
        </>
      ) : (
        <GlassCard className="text-center py-12">
          <Filter className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No tickets found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            No tickets match your current filter criteria.
          </p>
        </GlassCard>
      )}
    </div>
  );
};