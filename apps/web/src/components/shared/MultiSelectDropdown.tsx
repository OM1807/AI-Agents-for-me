'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  id: string;
  label: string;
  value: string;
  metadata?: any;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onSelectionChange: (selectedValues: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onSearchChange?: (search: string) => void;
}

export function MultiSelectDropdown({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  emptyText = 'No items found',
  className,
  disabled = false,
  loading = false,
  onSearchChange,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsFocused(false);
    setSearchQuery('');
    onSearchChange?.('');
    inputRef.current?.blur();
  }, [onSearchChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClose, isOpen]);

  // Handle opening/closing dropdown
  const handleOpen = useCallback(() => {
    if (!disabled && !loading) {
      setIsOpen(true);
      setIsFocused(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [disabled, loading]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (!isOpen) {
      setIsOpen(true);
    }
  }, [isOpen]);

  const handleBlur = useCallback(() => {
    // Small delay to allow for option clicks
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        handleClose();
      }
    }, 150);
  }, [handleClose]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter' && !isOpen) {
        e.preventDefault();
        handleOpen();
      }
    },
    [isOpen, handleClose, handleOpen]
  );

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected options for display
  const selectedOptions = options.filter(option =>
    selectedValues.includes(option.value)
  );

  const handleToggleOption = useCallback(
    (value: string) => {
      const newSelection = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];

      onSelectionChange(newSelection);
    },
    [selectedValues, onSelectionChange]
  );

  const handleRemoveSelection = useCallback(
    (value: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const newSelection = selectedValues.filter(v => v !== value);
      onSelectionChange(newSelection);
    },
    [selectedValues, onSelectionChange]
  );

  const handleClearAll = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      onSelectionChange([]);
    },
    [onSelectionChange]
  );

  // Get display text for input
  const getDisplayText = useCallback(() => {
    if (isFocused || isOpen) {
      return searchQuery;
    }
    if (selectedValues.length === 0) {
      return '';
    }
    if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option?.label || '';
    }
    return `${selectedValues.length} items selected`;
  }, [isFocused, isOpen, searchQuery, selectedValues, options]);

  const getPlaceholderText = useCallback(() => {
    if (isFocused || isOpen) {
      return searchPlaceholder;
    }
    return placeholder;
  }, [isFocused, isOpen, searchPlaceholder, placeholder]);

  return (
    <div className={cn('relative w-full', className)} ref={dropdownRef}>
      {/* Smart Input Trigger */}
      <div
        className={cn(
          'border-input bg-background relative flex min-h-9 w-full items-center rounded-md border px-3 py-1 text-sm transition-colors',
          'hover:border-ring focus-within:border-ring focus-within:ring-ring focus-within:ring-1',
          disabled && 'cursor-not-allowed opacity-50',
          (isFocused || isOpen) && 'border-ring ring-ring ring-1'
        )}
        onClick={handleOpen}
      >
        <input
          ref={inputRef}
          type='text'
          value={getDisplayText()}
          onChange={e => {
            const value = e.target.value;
            setSearchQuery(value);
            onSearchChange?.(value);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholderText()}
          disabled={disabled}
          className={cn(
            'placeholder:text-muted-foreground flex-1 bg-transparent outline-none',
            'cursor-text',
            !isFocused &&
              !isOpen &&
              selectedValues.length === 0 &&
              'cursor-pointer'
          )}
          readOnly={!isOpen && !isFocused}
        />

        {loading ? (
          <div className='flex-shrink-0'>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent'></div>
          </div>
        ) : (
          <ChevronDown
            className={cn(
              'text-muted-foreground h-4 w-4 flex-shrink-0 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </div>

      {/* Selected Items Badges */}
      {selectedOptions.length > 0 && !isOpen && (
        <div className='mt-2 flex flex-wrap gap-1'>
          {selectedOptions.map(option => (
            <Badge
              key={option.value}
              variant='secondary'
              className='group gap-1 pr-1.5'
            >
              <span className='max-w-[120px] truncate' title={option.label}>
                {option.label}
              </span>
              <button
                onClick={e => handleRemoveSelection(option.value, e)}
                className='hover:bg-muted-foreground/20 ml-1 rounded-full p-0.5 transition-colors'
                title={`Remove ${option.label}`}
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          ))}
          {selectedOptions.length > 1 && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClearAll}
              className='text-muted-foreground hover:text-foreground h-6 px-2 text-xs'
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Dropdown Content */}
      {isOpen && (
        <div className='bg-popover absolute top-full left-0 z-50 mt-1 w-full rounded-md border shadow-lg'>
          <div className='max-h-48 overflow-y-auto p-1'>
            {loading ? (
              <div className='text-muted-foreground flex items-center justify-center py-8 text-sm'>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent'></div>
                Loading options...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className='text-muted-foreground py-8 text-center text-sm'>
                {searchQuery
                  ? 'No items found matching your search'
                  : emptyText}
              </div>
            ) : (
              <div className='space-y-0.5'>
                {filteredOptions.map(option => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        'hover:bg-accent flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm transition-colors',
                        isSelected && 'bg-accent/50'
                      )}
                      onClick={() => handleToggleOption(option.value)}
                      onMouseDown={e => e.preventDefault()} // Prevent input blur
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent click
                        className='pointer-events-none'
                      />
                      <span className='flex-1 truncate' title={option.label}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <Check className='text-primary h-4 w-4 flex-shrink-0' />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
