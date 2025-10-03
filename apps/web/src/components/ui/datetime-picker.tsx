'use client';

import * as React from 'react';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';

// Single DateTime Picker Props
export interface DateTimePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

// Date Range Picker Props
export interface DateTimeRangePickerProps {
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

// Convert Date to datetime-local string format
const dateToDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Convert datetime-local string to Date
const dateTimeLocalToDate = (dateTimeLocal: string): Date => {
  return new Date(dateTimeLocal);
};

// Single DateTime Picker Component
export function DateTimePicker({
  date,
  onDateChange,
  placeholder = 'Select date & time',
  disabled,
  className,
  label,
}: DateTimePickerProps) {
  const dateTimeValue = date ? dateToDateTimeLocal(date) : '';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      const newDate = dateTimeLocalToDate(value);
      onDateChange?.(newDate);
    } else {
      onDateChange?.(undefined);
    }
  };

  return (
    <div className={className}>
      {label && <Label className='text-sm font-medium'>{label}</Label>}
      <div className='relative'>
        <input
          type='datetime-local'
          value={dateTimeValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            // Base styles matching shadcn/ui input
            'border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm',
            // Typography
            'placeholder:text-muted-foreground font-normal',
            // Focus styles
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            // Disabled styles
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Hover styles
            'hover:border-accent-foreground/20',
            // Remove default appearance
            'appearance-none',
            // Custom webkit calendar picker styling
            '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2',
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70',
            '[&::-webkit-calendar-picker-indicator]:transition-opacity [&::-webkit-calendar-picker-indicator]:hover:opacity-100'
          )}
        />
      </div>
    </div>
  );
}

// Date Range Picker Component
export function DateTimeRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = 'Select date range',
  disabled,
  className,
  label,
}: DateTimeRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [fromTime, setFromTime] = React.useState('00:00');
  const [toTime, setToTime] = React.useState('23:59');

  // Initialize times from dateRange
  React.useEffect(() => {
    if (dateRange?.from) {
      setFromTime(format(dateRange.from, 'HH:mm'));
    }
    if (dateRange?.to) {
      setToTime(format(dateRange.to, 'HH:mm'));
    }
  }, [dateRange]);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range) {
      const newRange = { from: range.from, to: range.to };

      // Apply time to the dates
      if (newRange.from) {
        const [hours, minutes] = fromTime.split(':').map(Number);
        newRange.from.setHours(hours, minutes, 0, 0);
      }

      if (newRange.to) {
        const [hours, minutes] = toTime.split(':').map(Number);
        newRange.to.setHours(hours, minutes, 59, 999);
      }

      onDateRangeChange?.(newRange);

      // Close popover if both dates are selected
      if (newRange.from && newRange.to) {
        setIsOpen(false);
      }
    }
  };

  const handleTimeChange = (type: 'from' | 'to', time: string) => {
    if (type === 'from') {
      setFromTime(time);
      if (dateRange?.from) {
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(dateRange.from);
        newDate.setHours(hours, minutes, 0, 0);
        onDateRangeChange?.({ ...dateRange, from: newDate });
      }
    } else {
      setToTime(time);
      if (dateRange?.to) {
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(dateRange.to);
        newDate.setHours(hours, minutes, 59, 999);
        onDateRangeChange?.({ ...dateRange, to: newDate });
      }
    }
  };

  const formatDisplayText = () => {
    if (!dateRange?.from) return placeholder;

    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'MMM dd, HH:mm')} - ${format(dateRange.to, 'MMM dd, HH:mm')}`;
    }

    return `${format(dateRange.from, 'MMM dd, HH:mm')} - Select end date`;
  };

  return (
    <div className={className}>
      {label && (
        <Label className='mb-2 block text-sm font-medium'>{label}</Label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            disabled={disabled}
            className={cn(
              'h-10 w-full justify-between font-normal',
              !dateRange?.from && 'text-muted-foreground'
            )}
          >
            <div className='flex items-center gap-2'>
              <CalendarIcon className='h-4 w-4' />
              {formatDisplayText()}
            </div>
            <ChevronDownIcon className='h-4 w-4' />
          </Button>
        </PopoverTrigger>

        <PopoverContent className='w-auto p-0' align='start'>
          <div className='space-y-4 p-3'>
            {/* Calendar for date range selection */}
            <Calendar
              mode='range'
              defaultMonth={dateRange?.from}
              selected={dateRange as DateRange}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
              captionLayout='dropdown'
              className='rounded-md border-0'
            />

            {/* Time selectors */}
            <div className='space-y-3 border-t pt-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label className='text-xs font-medium'>From Time</Label>
                  <Input
                    type='time'
                    value={fromTime}
                    onChange={e => handleTimeChange('from', e.target.value)}
                    className='text-sm'
                  />
                </div>
                <div className='space-y-2'>
                  <Label className='text-xs font-medium'>To Time</Label>
                  <Input
                    type='time'
                    value={toTime}
                    onChange={e => handleTimeChange('to', e.target.value)}
                    className='text-sm'
                  />
                </div>
              </div>

              {dateRange?.from && dateRange?.to && (
                <div className='text-muted-foreground pt-2 text-center text-sm'>
                  {format(dateRange.from, 'MMM dd, yyyy HH:mm')} -{' '}
                  {format(dateRange.to, 'MMM dd, yyyy HH:mm')}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
