import React from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, MessageSquare, CheckCircle, XCircle, Package, Calendar, ExternalLink } from 'lucide-react';
import { Feedback } from '../types/feedback';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';

interface FeedbackCardProps {
  feedback: Feedback;
  onEdit: (feedback: Feedback) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

const platformColors = {
  'Intercom': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  'Discord': 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
  'X': 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
  'Zoom (Analyst Call)': 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200'
};

const platformIcons = {
  'Intercom': MessageSquare,
  'Discord': MessageSquare,
  'X': ExternalLink,
  'Zoom (Analyst Call)': Calendar
};

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ 
  feedback, 
  onEdit, 
  onDelete, 
  compact = false,
  selectable = false,
  selected = false,
  onSelect
}) => {
  const PlatformIcon = platformIcons[feedback.platform];

  const handleSelect = (checked: boolean) => {
    if (onSelect) {
      onSelect(feedback.id, checked);
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
          
          {/* Left: Feedback Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <PlatformIcon className="w-4 h-4" />
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${platformColors[feedback.platform]}`}>
                  {feedback.platform}
                </span>
              </div>
              {feedback.ticket_id && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  #{feedback.ticket_id}
                </span>
              )}
              {feedback.core_team_acknowledgement && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              {feedback.shipped && (
                <Package className="w-4 h-4 text-blue-500" />
              )}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {feedback.description || 'No description provided'}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Created: {format(new Date(feedback.created_at), 'MMM dd, yyyy')}</span>
              {feedback.product && (
                <span>Product: {feedback.product}</span>
              )}
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={() => onEdit(feedback)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => onDelete(feedback.id)}
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
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <PlatformIcon className="w-5 h-5" />
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${platformColors[feedback.platform]}`}>
                    {feedback.platform}
                  </span>
                </div>
                {feedback.ticket_id && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                    Ticket #{feedback.ticket_id}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {feedback.core_team_acknowledgement ? (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Acknowledged</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Pending Review</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {feedback.shipped ? (
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Package className="w-4 h-4" />
                      <span className="text-sm font-medium">Shipped</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                      <Package className="w-4 h-4" />
                      <span className="text-sm">Not Shipped</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={() => onEdit(feedback)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => onDelete(feedback.id)}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Product */}
        {feedback.product && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product</h4>
            <span className="px-2 py-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
              {feedback.product}
            </span>
          </div>
        )}

        {/* Description */}
        {feedback.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{feedback.description}</p>
          </div>
        )}

        {/* Dates */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span>Created: {format(new Date(feedback.created_at), 'MMM dd, yyyy')}</span>
          {feedback.shipping_date && (
            <span>Shipped: {format(new Date(feedback.shipping_date), 'MMM dd, yyyy')}</span>
          )}
        </div>
      </div>
    </GlassCard>
  );
};