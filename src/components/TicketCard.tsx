import React from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Ticket } from '../types/ticket';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';

interface TicketCardProps {
  ticket: Ticket;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

const statusColors = {
  'Not Started': 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
  'Reviewed by Dev': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  'Waiting on Mod': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  'Under Review': 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
  'In Dev': 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
  'In QA': 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200',
  'Waiting on User': 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
  'Under Review - Sumsub': 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
  'Under Review - Provenance': 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200',
  'Under Review - Rain': 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
  'Under Review - Core Team': 'bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200',
  'Resolved': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
};

const severityColors = {
  'SEV-1': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
  'SEV-2': 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800',
  'SEV-3': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
  'SEV-4': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
  'SEV-5': 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
};

export const TicketCard: React.FC<TicketCardProps> = ({ 
  ticket, 
  onEdit, 
  onDelete, 
  compact = false,
  selectable = false,
  selected = false,
  onSelect
}) => {
  const handleSelect = (checked: boolean) => {
    if (onSelect) {
      onSelect(ticket.id, checked);
    }
  };

  if (compact) {
    return (
      <GlassCard hoverable className="group">
        <div className="flex items-center gap-4">
          {/* Selection Checkbox */}
          {selectable && (
            <Checkbox
              checked={selected}
              onChange={handleSelect}
            />
          )}
          
          {/* Left: Ticket Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">#{ticket.ticket_id}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityColors[ticket.severity]}`}>
                {ticket.severity}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[ticket.status]}`}>
                {ticket.status}
              </span>
              {ticket.status === 'Resolved' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {ticket.issue_description}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Created: {format(new Date(ticket.date_created), 'MMM dd, yyyy')}</span>
              {ticket.date_resolved && (
                <span>Resolved: {format(new Date(ticket.date_resolved), 'MMM dd, yyyy')}</span>
              )}
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={() => onEdit(ticket)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => onDelete(ticket.id)}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </Button>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard hoverable className="group">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Selection Checkbox */}
            {selectable && (
              <div className="pt-1">
                <Checkbox
                  checked={selected}
                  onChange={handleSelect}
                />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">#{ticket.ticket_id}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityColors[ticket.severity]}`}>
                  {ticket.severity}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[ticket.status]}`}>
                  {ticket.status}
                </span>
                {ticket.status === 'Resolved' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={() => onEdit(ticket)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => onDelete(ticket.id)}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Issue Description */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Description</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{ticket.issue_description}</p>
        </div>

        {/* Contact Info */}
        {ticket.contact_info && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{ticket.contact_info}</p>
          </div>
        )}

        {/* Tags */}
        <div className="space-y-2">
          {ticket.product_tags && ticket.product_tags.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Products</h4>
              <div className="flex flex-wrap gap-1">
                {ticket.product_tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    {tag}
                  </span>
                ))}
                {ticket.product_tags.length > 3 && (
                  <span className="px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
                    +{ticket.product_tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
          {ticket.category_tags && ticket.category_tags.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Categories</h4>
              <div className="flex flex-wrap gap-1">
                {ticket.category_tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800"
                  >
                    {tag}
                  </span>
                ))}
                {ticket.category_tags.length > 3 && (
                  <span className="px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
                    +{ticket.category_tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span>Created: {format(new Date(ticket.date_created), 'MMM dd, yyyy')}</span>
          {ticket.date_resolved && (
            <span>Resolved: {format(new Date(ticket.date_resolved), 'MMM dd, yyyy')}</span>
          )}
        </div>

        {/* Comments Preview */}
        {ticket.core_team_comments && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Core Team Comments</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.core_team_comments}</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};