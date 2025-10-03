import { cn } from '@/lib/utils';

interface ServiceTileProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  isConnected?: boolean;
  description?: string;
  onClick?: () => void;
  onDisconnect?: () => void;
  className?: string;
  disabled?: boolean;
}

export const ServiceTile = ({
  icon: Icon,
  title,
  isConnected = false,
  description,
  onClick,
  onDisconnect,
  className,
  disabled = false,
}: ServiceTileProps) => {
  const handleDisconnectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDisconnect?.();
  };

  const handleMainClick = () => {
    if (!isConnected && onClick && !disabled) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleMainClick}
      className={cn(
        'group relative flex h-32 w-32 flex-col rounded-lg border border-gray-200 bg-white p-3 transition-all duration-200',
        !disabled && 'hover:border-gray-300 hover:bg-gray-50 hover:shadow-md',
        isConnected && 'border-green-500 bg-green-50',
        !isConnected && !disabled && 'cursor-pointer',
        disabled && 'cursor-not-allowed bg-gray-50 opacity-60',
        className
      )}
      role='button'
      tabIndex={!isConnected && !disabled ? 0 : -1}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleMainClick();
        }
      }}
    >
      {/* Icon Container - Fixed position */}
      <div className='flex justify-center pt-2 pb-3'>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100',
            isConnected && 'bg-green-100'
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5 text-gray-600',
              isConnected && 'text-green-600',
              disabled && 'text-gray-400'
            )}
          />
        </div>
      </div>

      {/* Text Container - Fixed layout */}
      <div className='flex flex-col items-center space-y-1'>
        {/* Title - Fixed height */}
        <div className='flex h-4 items-center'>
          <span
            className={cn(
              'px-1 text-center text-xs font-semibold text-gray-900',
              disabled && 'text-gray-500'
            )}
          >
            {title}
          </span>
        </div>

        {/* Description - Fixed height and position */}
        <div className='flex h-6 items-start justify-center'>
          <span className='px-1 text-center text-[10px] leading-3 text-gray-500'>
            {description}
          </span>
        </div>
      </div>

      {/* Connection Status Indicator */}
      {isConnected && (
        <div className='absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white' />
      )}

      {/* Disconnect Overlay - Shows on hover when connected */}
      {isConnected && (
        <div className='absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-80'>
          <button
            onClick={handleDisconnectClick}
            className='rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm transition-colors duration-150 hover:bg-red-50'
            type='button'
            aria-label={`Disconnect ${title}`}
            tabIndex={0}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
