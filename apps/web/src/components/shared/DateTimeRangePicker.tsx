'use client';

import * as React from 'react';
import {
  addDays,
  format,
  isAfter,
  isBefore,
  isValid,
  setHours,
  setMinutes,
} from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Types
export type DateRangeValue = {
  from: Date | null;
  to: Date | null;
};

export type Preset = {
  label: string;
  range: { from: Date; to: Date };
};

export interface DateTimeRangePickerProps {
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  onChange?: (next: DateRangeValue) => void;
  presets?: Preset[];
  caption?: string;
  disablePast?: boolean;
  disableFuture?: boolean;
  min?: Date;
  max?: Date;
  className?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

// Default presets
export const createDefaultPresets = (): Preset[] => {
  const today = stripTime(new Date());

  return [
    {
      label: 'Today',
      range: {
        from: new Date(today.setHours(0, 0, 0, 0)),
        to: new Date(today.setHours(23, 59, 59, 999)),
      },
    },
    {
      label: 'Yesterday',
      range: {
        from: addDays(stripTime(new Date()), -1),
        to: setMinutes(setHours(addDays(stripTime(new Date()), -1), 23), 59),
      },
    },
    {
      label: 'Last 7 days',
      range: {
        from: addDays(stripTime(new Date()), -6),
        to: setMinutes(setHours(stripTime(new Date()), 23), 59),
      },
    },
    {
      label: 'Last 30 days',
      range: {
        from: addDays(stripTime(new Date()), -29),
        to: setMinutes(setHours(stripTime(new Date()), 23), 59),
      },
    },
  ];
};
export const DateTimeRangePicker = React.forwardRef<
  HTMLDivElement,
  DateTimeRangePickerProps
>(
  (
    {
      value,
      defaultValue,
      onChange,
      presets = createDefaultPresets(),
      caption,
      disablePast = false,
      disableFuture = false,
      min,
      max,
      className,
      label,
      placeholder = 'Pick date & time range',
      disabled = false,
    },
    ref
  ) => {
    // Controlled/uncontrolled state handling
    const [internal, setInternal] = React.useState<DateRangeValue>(
      defaultValue ?? { from: null, to: null }
    );
    const current = value ?? internal;

    const setCurrent = (next: DateRangeValue) => {
      if (!value) setInternal(next);
      onChange?.(next);
    };

    // Popover visibility
    const [open, setOpen] = React.useState(false);

    // Helpers
    const today = new Date();
    const minDate = min ?? (disablePast ? today : undefined);
    const maxDate = max ?? (disableFuture ? today : undefined);

    const fmtTime = (d: Date | null) =>
      d && isValid(d) ? format(d, 'HH:mm') : '';

    const parseTime = (val: string, base: Date | null) => {
      if (!base || !isValid(base)) return null;
      const [h, m] = val.split(':').map(s => parseInt(s, 10));
      if (Number.isNaN(h) || Number.isNaN(m)) return base;
      return setMinutes(setHours(base, h), m);
    };

    const setFromTime = (t: string) => {
      const nextFrom = parseTime(t, current.from);
      if (!nextFrom) return;
      const next = { ...current, from: nextFrom } as DateRangeValue;
      // Ensure order
      if (next.to && isAfter(nextFrom, next.to)) {
        next.to = nextFrom;
      }
      setCurrent(next);
    };

    const setToTime = (t: string) => {
      const base = current.to ?? current.from ?? new Date();
      const nextTo = parseTime(t, base);
      if (!nextTo) return;
      const next = { ...current, to: nextTo } as DateRangeValue;
      // Ensure order
      if (next.from && isAfter(next.from, nextTo)) {
        next.from = nextTo;
      }
      setCurrent(next);
    };

    const onSelectRange = (range: { from?: Date; to?: Date } | undefined) => {
      const from = range?.from ?? null;
      const to = range?.to ?? null;

      // Preserve existing times if available
      const withTimes: DateRangeValue = {
        from:
          from && current.from
            ? setMinutes(
                setHours(from, current.from.getHours()),
                current.from.getMinutes()
              )
            : from,
        to:
          to && current.to
            ? setMinutes(
                setHours(to, current.to.getHours()),
                current.to.getMinutes()
              )
            : to,
      };

      // If user picked a single day (from only), seed end = from + 1 hour
      if (withTimes.from && !withTimes.to) {
        withTimes.to = setMinutes(
          setHours(withTimes.from, withTimes.from.getHours() + 1),
          withTimes.from.getMinutes()
        );
      }

      setCurrent(withTimes);
    };

    const applyPreset = (p: Preset) => {
      setCurrent({ from: p.range.from, to: p.range.to });
    };

    const clear = () => setCurrent({ from: null, to: null });

    const displayLabel = React.useMemo(() => {
      const f = current.from;
      const t = current.to;
      if (!f && !t) return placeholder;
      if (f && !t) return `${format(f, 'PP p')} → …`;
      if (!f && t) return `… → ${format(t, 'PP p')}`;
      return `${format(f!, 'PP p')} → ${format(t!, 'PP p')}`;
    }, [current.from, current.to, placeholder]);

    // Validations for disabling dates
    const disabledMatcher = (date: Date) => {
      if (minDate && isBefore(date, stripTime(minDate))) return true;
      if (maxDate && isAfter(date, stripTime(maxDate))) return true;
      return false;
    };

    return (
      <div ref={ref} className={cn('w-full space-y-2', className)}>
        {label && <Label className='text-sm font-medium'>{label}</Label>}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              disabled={disabled}
              className={cn(
                'w-full justify-between text-left font-normal',
                !current.from && !current.to && 'text-muted-foreground'
              )}
            >
              <span className='inline-flex items-center gap-2'>
                <CalendarIcon className='h-4 w-4' />
                {displayLabel}
              </span>
            </Button>
          </PopoverTrigger>

          <PopoverContent className='w-auto p-0' align='start'>
            <div className='flex'>
              {/* Left: Calendar */}
              <div className='p-3'>
                <Calendar
                  mode='range'
                  numberOfMonths={2}
                  selected={{
                    from: current.from ?? undefined,
                    to: current.to ?? undefined,
                  }}
                  onSelect={onSelectRange}
                  disabled={disabledMatcher}
                  initialFocus
                />
              </div>

              {/* Right: Time + Presets */}
              <div className='w-80 border-l p-3'>
                <div className='space-y-4'>
                  {/* Time Selection */}
                  <div className='space-y-2'>
                    <Label className='flex items-center gap-2 text-sm font-medium'>
                      <Clock className='h-4 w-4' />
                      Time Selection
                    </Label>

                    <div className='grid grid-cols-2 gap-3'>
                      <div className='space-y-2'>
                        <Label
                          htmlFor='fromTime'
                          className='text-muted-foreground text-xs'
                        >
                          Start Time
                        </Label>
                        <Input
                          id='fromTime'
                          type='time'
                          step={60}
                          value={fmtTime(current.from)}
                          onChange={e => setFromTime(e.target.value)}
                          disabled={!current.from}
                          className='text-sm'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label
                          htmlFor='toTime'
                          className='text-muted-foreground text-xs'
                        >
                          End Time
                        </Label>
                        <Input
                          id='toTime'
                          type='time'
                          step={60}
                          value={fmtTime(current.to)}
                          onChange={e => setToTime(e.target.value)}
                          disabled={!current.to}
                          className='text-sm'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Presets */}
                  {presets && presets.length > 0 && (
                    <div className='space-y-2'>
                      <Label className='text-muted-foreground text-xs font-medium'>
                        Quick Presets
                      </Label>
                      <div className='grid grid-cols-2 gap-2'>
                        {presets.map(preset => (
                          <Button
                            key={preset.label}
                            variant='secondary'
                            size='sm'
                            onClick={() => applyPreset(preset)}
                            className='text-xs'
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className='flex items-center justify-between border-t pt-3'>
                    <div className='text-muted-foreground text-xs'>
                      {caption ?? 'Times in local timezone'}
                    </div>
                    <div className='flex gap-2'>
                      <Button variant='ghost' size='sm' onClick={clear}>
                        Clear
                      </Button>
                      <Button
                        size='sm'
                        onClick={() => setOpen(false)}
                        disabled={!current.from || !current.to}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

DateTimeRangePicker.displayName = 'DateTimeRangePicker';

// Utils
function stripTime(d: Date): Date {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  return nd;
}
