'use client';

import { ApiSpecCard } from './ApiSpecCard';
import { ApiSpecListProps } from '@/types/agent-api-suite';
import { toast } from 'sonner';

export function ApiSpecList({
  specs,
  selectedSpecs,
  onToggleSpec,
  onRemoveSpec,
}: ApiSpecListProps) {
  const handleRemoveSpec = (specId: string, specName: string) => {
    onRemoveSpec(specId);
    toast.success(`"${specName}" removed successfully`);
  };

  return (
    <div className='space-y-3'>
      {specs.map(spec => (
        <ApiSpecCard
          key={spec.id}
          spec={spec}
          isSelected={selectedSpecs.includes(spec.id)}
          onToggle={() => onToggleSpec(spec.id)}
          onRemove={() => handleRemoveSpec(spec.id, spec.name)}
        />
      ))}
    </div>
  );
}
