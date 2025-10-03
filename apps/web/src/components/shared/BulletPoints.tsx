'use client';

import { cn } from '@/lib/utils';

export interface BulletPoint {
  text: string;
  subPoints?: BulletPoint[];
}

interface BulletPointsProps {
  points: BulletPoint[];
  className?: string;
}

export default function BulletPoints({
  points,
  className = '',
}: BulletPointsProps) {
  const renderBulletPoints = (
    bulletPoints: BulletPoint[],
    level: number = 0
  ) => {
    return bulletPoints.map((point, index) => (
      <div key={index} className='flex flex-col'>
        <div className='flex items-center gap-2'>
          <span className='text-gray-600'>•</span>
          <span className='text-sm leading-relaxed'>{point.text}</span>
        </div>

        {point.subPoints && point.subPoints.length > 0 && (
          <div className='mt-1 ml-4'>
            {renderBulletPoints(point.subPoints, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className={cn('space-y-2', className)}>
      {renderBulletPoints(points)}
    </div>
  );
}
