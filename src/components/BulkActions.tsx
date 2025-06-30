import React, { useState } from 'react';
import { Trash2, Edit, Download, CheckSquare, X, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { GlassCard } from './ui/GlassCard';

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkStatusUpdate?: (status: string) => void;
  onBulkExport: () => void;
  statusOptions?: { value: string; label: string }[];
  type: 'tickets' | 'feedback';
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkStatusUpdate,
  onBulkExport,
  statusOptions = [],
  type
}) => {
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStatusUpdate = () => {
    if (selectedStatus && onBulkStatusUpdate) {
      onBulkStatusUpdate(selectedStatus);
      setSelectedStatus('');
      setShowStatusUpdate(false);
    }
  };

  const handleDelete = () => {
    onBulkDelete();
    setShowDeleteConfirm(false);
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <GlassCard className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedCount} {type} selected
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {statusOptions.length > 0 && onBulkStatusUpdate && (
              <Button
                variant="secondary"
                size="sm"
                icon={Edit}
                onClick={() => setShowStatusUpdate(true)}
                className="flex-1 sm:flex-none"
              >
                Update Status
              </Button>
            )}
            
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={onBulkExport}
              className="flex-1 sm:flex-none"
            >
              Export Selected
            </Button>
            
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 sm:flex-none"
            >
              Delete Selected
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={onClearSelection}
              className="flex-1 sm:flex-none"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Status Update Modal */}
      {showStatusUpdate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-md">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Update Status for {selectedCount} {type}
              </h3>
              
              <Select
                label="New Status"
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={statusOptions}
                placeholder="Select new status..."
              />
              
              <div className="flex gap-3">
                <Button
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus}
                  className="flex-1"
                >
                  Update Status
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowStatusUpdate(false);
                    setSelectedStatus('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-md">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirm Deletion
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete {selectedCount} selected {type}? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Delete {selectedCount} {type}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
};