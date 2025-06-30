import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  className = '',
  label
}) => {
  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`
          w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center
          ${checked 
            ? 'bg-blue-600 border-blue-600 text-white' 
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400'
          }
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}>
          {checked && <Check className="w-3 h-3" />}
        </div>
      </div>
      {label && (
        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
};