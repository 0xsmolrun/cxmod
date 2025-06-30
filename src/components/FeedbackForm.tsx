import React, { useState, useEffect } from 'react';
import { Plus, X, Save, MessageSquare } from 'lucide-react';
import { Feedback, FeedbackFormData, Platform } from '../types/feedback';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TextArea } from './ui/TextArea';
import { Select } from './ui/Select';
import { GlassCard } from './ui/GlassCard';

interface FeedbackFormProps {
  feedback?: Feedback;
  onSave: (data: FeedbackFormData) => Promise<void>;
  onCancel: () => void;
}

const platformOptions = [
  { value: 'Intercom', label: 'Intercom' },
  { value: 'Discord', label: 'Discord' },
  { value: 'X', label: 'X (Twitter)' },
  { value: 'Zoom (Analyst Call)', label: 'Zoom (Analyst Call)' }
];

const booleanOptions = [
  { value: '', label: 'Not Set' },
  { value: 'true', label: 'TRUE' },
  { value: 'false', label: 'FALSE' }
];

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  feedback,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<FeedbackFormData>({
    ticket_id: '',
    created_at: new Date().toISOString().split('T')[0],
    platform: 'Intercom',
    product: '',
    description: '',
    core_team_acknowledgement: undefined,
    shipped: undefined,
    shipping_date: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (feedback) {
      setFormData({
        ticket_id: feedback.ticket_id?.toString() || '',
        created_at: feedback.created_at.split('T')[0],
        platform: feedback.platform,
        product: feedback.product || '',
        description: feedback.description || '',
        core_team_acknowledgement: feedback.core_team_acknowledgement,
        shipped: feedback.shipped,
        shipping_date: feedback.shipping_date || ''
      });
    }
  }, [feedback]);

  // Auto-set shipping date when shipped is set to true
  useEffect(() => {
    if (formData.shipped === true && !formData.shipping_date) {
      setFormData(prev => ({
        ...prev,
        shipping_date: new Date().toISOString().split('T')[0]
      }));
    } else if (formData.shipped === false) {
      setFormData(prev => ({
        ...prev,
        shipping_date: ''
      }));
    }
  }, [formData.shipped]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Validate platform
    if (!formData.platform) {
      errors.platform = 'Platform is required';
    }

    // Validate ticket_id based on platform
    if (formData.platform === 'Intercom') {
      if (!formData.ticket_id || !formData.ticket_id.trim()) {
        errors.ticket_id = 'Ticket ID is required for Intercom platform';
      }
    }

    // Validate created_at
    if (!formData.created_at) {
      errors.created_at = 'Date of feedback is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(formData);
      onCancel();
      if (!feedback) {
        setFormData({
          ticket_id: '',
          created_at: new Date().toISOString().split('T')[0],
          platform: 'Intercom',
          product: '',
          description: '',
          core_team_acknowledgement: undefined,
          shipped: undefined,
          shipping_date: ''
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof FeedbackFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBooleanChange = (field: 'core_team_acknowledgement' | 'shipped', value: string) => {
    if (value === '') {
      updateField(field, undefined);
    } else {
      updateField(field, value === 'true');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-blue-400" />
              {feedback ? 'Edit Feedback/Feature Request' : 'Create New Feedback/Feature Request'}
            </h2>
            <Button
              type="button"
              onClick={onCancel}
              variant="ghost"
              icon={X}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Select
              label="Platform"
              value={formData.platform}
              onChange={(value) => updateField('platform', value as Platform)}
              options={platformOptions}
              required
              error={formErrors.platform}
            />

            <Input
              label="Date of Feedback Raised"
              type="date"
              value={formData.created_at}
              onChange={(value) => updateField('created_at', value)}
              required
              error={formErrors.created_at}
            />
          </div>

          {/* Ticket ID field - required for Intercom, optional for others */}
          <Input
            label={`Ticket ID ${formData.platform === 'Intercom' ? '(Required)' : '(Optional)'}`}
            type="number"
            value={formData.ticket_id || ''}
            onChange={(value) => updateField('ticket_id', value)}
            placeholder={formData.platform === 'Intercom' ? 'Enter ticket ID (required)' : 'Enter ticket ID (optional)'}
            required={formData.platform === 'Intercom'}
            error={formErrors.ticket_id}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Input
              label="Product"
              value={formData.product || ''}
              onChange={(value) => updateField('product', value)}
              placeholder="Enter product name..."
            />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Core Team Acknowledgement
                </label>
                <select
                  value={formData.core_team_acknowledgement === undefined ? '' : formData.core_team_acknowledgement.toString()}
                  onChange={(e) => handleBooleanChange('core_team_acknowledgement', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 hover:bg-white/90 dark:hover:bg-gray-800/90 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Not Set</option>
                  <option value="true">TRUE</option>
                  <option value="false">FALSE</option>
                </select>
              </div>
            </div>
          </div>

          <TextArea
            label="Description"
            value={formData.description || ''}
            onChange={(value) => updateField('description', value)}
            placeholder="Describe the feedback or feature request..."
            rows={4}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Shipped
              </label>
              <select
                value={formData.shipped === undefined ? '' : formData.shipped.toString()}
                onChange={(e) => handleBooleanChange('shipped', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 hover:bg-white/90 dark:hover:bg-gray-800/90 text-gray-900 dark:text-gray-100"
              >
                <option value="">Not Set</option>
                <option value="true">TRUE</option>
                <option value="false">FALSE</option>
              </select>
            </div>

            {formData.shipped === true && (
              <Input
                label="Shipping Date"
                type="date"
                value={formData.shipping_date || ''}
                onChange={(value) => updateField('shipping_date', value)}
                placeholder="Auto-set when shipped is true"
              />
            )}
          </div>

          {/* Information Card */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 text-lg">Form Guidelines</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <li>• <strong>Ticket ID:</strong> Required for Intercom platform, optional for others</li>
              <li>• <strong>Platform:</strong> Select the source where this feedback was received</li>
              <li>• <strong>Product:</strong> Enter the product name related to this feedback</li>
              <li>• <strong>Core Team Acknowledgement:</strong> Set to TRUE/FALSE or leave as Not Set</li>
              <li>• <strong>Shipped:</strong> Set to TRUE/FALSE or leave as Not Set</li>
              <li>• <strong>Shipping Date:</strong> Automatically set when "Shipped" is marked as TRUE</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10 dark:border-gray-700/20">
            <Button
              type="button"
              onClick={onCancel}
              variant="ghost"
              className="flex-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              icon={feedback ? Save : Plus}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isSubmitting ? 'Saving...' : feedback ? 'Update Feedback' : 'Create Feedback'}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};