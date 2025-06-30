import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Save, ChevronDown, Tag } from 'lucide-react';
import { Ticket, TicketFormData, TicketStatus, Severity } from '../types/ticket';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TextArea } from './ui/TextArea';
import { Select } from './ui/Select';
import { TagInput } from './ui/TagInput';
import { GlassCard } from './ui/GlassCard';
import { useTickets } from '../hooks/useTickets';

interface TicketFormProps {
  ticket?: Ticket;
  onSave: (data: TicketFormData) => Promise<void>;
  onCancel: () => void;
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
  { value: 'SEV-1', label: 'SEV-1 (Critical)' },
  { value: 'SEV-2', label: 'SEV-2 (High)' },
  { value: 'SEV-3', label: 'SEV-3 (Medium)' },
  { value: 'SEV-4', label: 'SEV-4 (Low)' },
  { value: 'SEV-5', label: 'SEV-5 (Minimal)' }
];

export const TicketForm: React.FC<TicketFormProps> = ({
  ticket,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<TicketFormData>({
    ticket_id: '',
    status: 'Not Started',
    core_team_comments: '',
    issue_description: '',
    contact_info: '',
    product_tags: [],
    category_tags: [],
    severity: 'SEV-3'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  
  // Refs for click outside detection
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  
  const { getUniqueTagsFromMemory, tickets } = useTickets();

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
        setProductSearchTerm('');
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
        setCategorySearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (ticket) {
      setFormData({
        ticket_id: ticket.ticket_id,
        status: ticket.status,
        core_team_comments: ticket.core_team_comments,
        issue_description: ticket.issue_description,
        contact_info: ticket.contact_info,
        product_tags: ticket.product_tags,
        category_tags: ticket.category_tags,
        severity: ticket.severity
      });
    }
  }, [ticket]);

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

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Validate Ticket ID - now required
    if (!formData.ticket_id || !formData.ticket_id.trim()) {
      errors.ticket_id = 'Ticket ID is required';
    }

    // Validate Issue Description
    if (!formData.issue_description || !formData.issue_description.trim()) {
      errors.issue_description = 'Issue description is required';
    }

    // Validate Contact Info
    if (!formData.contact_info || !formData.contact_info.trim()) {
      errors.contact_info = 'Contact information is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(formData);
      onCancel();
      if (!ticket) {
        setFormData({
          ticket_id: '',
          status: 'Not Started',
          core_team_comments: '',
          issue_description: '',
          contact_info: '',
          product_tags: [],
          category_tags: [],
          severity: 'SEV-3'
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof TicketFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addProductTag = (tag: string) => {
    if (tag && !formData.product_tags.includes(tag)) {
      updateField('product_tags', [...formData.product_tags, tag]);
    }
    setShowProductDropdown(false);
    setProductSearchTerm('');
  };

  const addCategoryTag = (tag: string) => {
    if (tag && !formData.category_tags.includes(tag)) {
      updateField('category_tags', [...formData.category_tags, tag]);
    }
    setShowCategoryDropdown(false);
    setCategorySearchTerm('');
  };

  const removeProductTag = (tagToRemove: string) => {
    updateField('product_tags', formData.product_tags.filter(tag => tag !== tagToRemove));
  };

  const removeCategoryTag = (tagToRemove: string) => {
    updateField('category_tags', formData.category_tags.filter(tag => tag !== tagToRemove));
  };

  // Filter available tags based on search term and exclude already selected ones
  const filteredProductTags = productSuggestions
    .filter(tag => !formData.product_tags.includes(tag))
    .filter(tag => tag.toLowerCase().includes(productSearchTerm.toLowerCase()));

  const filteredCategoryTags = categorySuggestions
    .filter(tag => !formData.category_tags.includes(tag))
    .filter(tag => tag.toLowerCase().includes(categorySearchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              {ticket ? 'Edit Ticket' : 'Create New Ticket'}
            </h2>
            <Button
              type="button"
              onClick={onCancel}
              variant="ghost"
              icon={X}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2"
            />
          </div>

          {/* Ticket ID Input - Now Required */}
          <Input
            label="Ticket ID"
            value={formData.ticket_id || ''}
            onChange={(value) => updateField('ticket_id', value)}
            placeholder="Enter ticket ID (required)"
            className="w-full"
            required
            error={formErrors.ticket_id}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Select
              label="Status"
              value={formData.status}
              onChange={(value) => updateField('status', value as TicketStatus)}
              options={statusOptions}
              required
            />

            <Select
              label="Severity"
              value={formData.severity}
              onChange={(value) => updateField('severity', value as Severity)}
              options={severityOptions}
              required
            />
          </div>

          <TextArea
            label="Issue Description"
            value={formData.issue_description}
            onChange={(value) => updateField('issue_description', value)}
            placeholder="Describe the issue in detail..."
            rows={4}
            required
            error={formErrors.issue_description}
          />

          <Input
            label="Wallet Address/Safe/Cash ID/Email"
            value={formData.contact_info}
            onChange={(value) => updateField('contact_info', value)}
            placeholder="Contact information for follow-up..."
            required
            error={formErrors.contact_info}
          />

          <TextArea
            label="Core Team Comments"
            value={formData.core_team_comments}
            onChange={(value) => updateField('core_team_comments', value)}
            placeholder="Internal notes and comments..."
            rows={3}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Enhanced Product Tags Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-500" />
                  Product Tags
                  {productSuggestions.length > 0 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                      {productSuggestions.length} available
                    </span>
                  )}
                </div>
              </label>
              
              {/* Selected Tags Display */}
              {formData.product_tags.length > 0 && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Selected Product Tags:</div>
                  <div className="flex flex-wrap gap-2">
                    {formData.product_tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full border border-blue-300 dark:border-blue-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeProductTag(tag)}
                          className="ml-2 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Tags Dropdown */}
              {productSuggestions.length > 0 && (
                <div className="relative mb-3" ref={productDropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowProductDropdown(!showProductDropdown);
                      setShowCategoryDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                        Select from {filteredProductTags.length} existing tags
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-blue-500 transition-transform duration-200 ${showProductDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showProductDropdown && (
                    <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-xl shadow-2xl max-h-64 overflow-hidden">
                      {/* Search Input */}
                      <div className="p-3 border-b border-blue-100 dark:border-blue-800">
                        <input
                          type="text"
                          value={productSearchTerm}
                          onChange={(e) => {
                            e.stopPropagation();
                            setProductSearchTerm(e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Search product tags..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          autoFocus
                        />
                      </div>
                      
                      {/* Tags List */}
                      <div className="max-h-48 overflow-y-auto">
                        {filteredProductTags.length > 0 ? (
                          filteredProductTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addProductTag(tag);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:outline-none text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-150 flex items-center gap-2"
                            >
                              <Tag className="w-3 h-3 text-blue-500" />
                              <span className="font-medium">{tag}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm text-center">
                            {productSearchTerm ? 'No matching tags found' : 'No available tags'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Tag Input */}
              <TagInput
                value={[]}
                onChange={(newTags) => {
                  newTags.forEach(tag => {
                    if (!formData.product_tags.includes(tag)) {
                      updateField('product_tags', [...formData.product_tags, tag]);
                    }
                  });
                }}
                suggestions={productSuggestions}
                placeholder="Type new product tags..."
              />
            </div>

            {/* Enhanced Category Tags Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-500" />
                  Category Tags
                  {categorySuggestions.length > 0 && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
                      {categorySuggestions.length} available
                    </span>
                  )}
                </div>
              </label>
              
              {/* Selected Tags Display */}
              {formData.category_tags.length > 0 && (
                <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">Selected Category Tags:</div>
                  <div className="flex flex-wrap gap-2">
                    {formData.category_tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded-full border border-purple-300 dark:border-purple-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeCategoryTag(tag)}
                          className="ml-2 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Tags Dropdown */}
              {categorySuggestions.length > 0 && (
                <div className="relative mb-3" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCategoryDropdown(!showCategoryDropdown);
                      setShowProductDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-800 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                        Select from {filteredCategoryTags.length} existing tags
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-purple-500 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showCategoryDropdown && (
                    <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-xl shadow-2xl max-h-64 overflow-hidden">
                      {/* Search Input */}
                      <div className="p-3 border-b border-purple-100 dark:border-purple-800">
                        <input
                          type="text"
                          value={categorySearchTerm}
                          onChange={(e) => {
                            e.stopPropagation();
                            setCategorySearchTerm(e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Search category tags..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          autoFocus
                        />
                      </div>
                      
                      {/* Tags List */}
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCategoryTags.length > 0 ? (
                          filteredCategoryTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addCategoryTag(tag);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 focus:bg-purple-50 dark:focus:bg-purple-900/20 focus:outline-none text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-150 flex items-center gap-2"
                            >
                              <Tag className="w-3 h-3 text-purple-500" />
                              <span className="font-medium">{tag}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm text-center">
                            {categorySearchTerm ? 'No matching tags found' : 'No available tags'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Tag Input */}
              <TagInput
                value={[]}
                onChange={(newTags) => {
                  newTags.forEach(tag => {
                    if (!formData.category_tags.includes(tag)) {
                      updateField('category_tags', [...formData.category_tags, tag]);
                    }
                  });
                }}
                suggestions={categorySuggestions}
                placeholder="Type new category tags..."
              />
            </div>
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
              icon={ticket ? Save : Plus}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isSubmitting ? 'Saving...' : ticket ? 'Update Ticket' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};