'use client';

import { useState } from 'react';
import { Link2, X, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';
import { TestCasesModalProps } from '@/types/agent-api-suite';

const SPEC_TYPES = [
  { value: 'Swagger', label: 'Swagger' },
  { value: 'Postman', label: 'Postman' },
  { value: 'OpenAPI', label: 'OpenAPI' },
];

export function ApiSpecUrlModal({ open, onOpenChange }: TestCasesModalProps) {
  const [specUrl, setSpecUrl] = useState('');
  const [specType, setSpecType] = useState('');
  const { addApiSpec } = useProject();

  const handleSubmit = async () => {
    if (!specUrl.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    if (!specType) {
      toast.error('Please select a spec type');
      return;
    }

    try {
      // Validate URL format
      new URL(specUrl);

      // Add URL to project state with only essential fields
      addApiSpec({
        id: Date.now().toString(),
        type: 'url' as const,
        source: specUrl,
        name: `API Spec - ${new URL(specUrl).hostname}`,
        specType: specType,
      });

      toast.success('API spec URL added successfully');
      setSpecUrl('');
      setSpecType('');
      onOpenChange(false);
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSpecUrl('');
    setSpecType('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=''>
        <DialogHeader className='pb-4'>
          <div className='flex items-center justify-between'>
            <div>
              <DialogTitle className='text-xl font-semibold'>
                <Link2 className='mr-2 inline h-5 w-5' />
                Paste API Spec URL
              </DialogTitle>
              <DialogDescription className='mt-1 text-gray-600'>
                Drop a link from Swagger, Postman, OpenAPI to fetch API Specs
                details
              </DialogDescription>
            </div>
            <button
              onClick={handleClose}
              className='absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full p-1 transition-colors hover:bg-gray-100'
            >
              <X size={16} />
            </button>
          </div>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='spec-url'>API Specification URL</Label>
            <Input
              id='spec-url'
              type='url'
              placeholder='https://api.example.com/openapi.json'
              value={specUrl}
              onChange={e => setSpecUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              className='w-full'
            />
          </div>

          <div className='space-y-2'>
            <Label>Spec Type *</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  className='w-full justify-between'
                  type='button'
                >
                  {specType || 'Select spec type'}
                  <ChevronDown className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-[var(--radix-dropdown-menu-trigger-width)]'>
                {SPEC_TYPES.map(type => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() => setSpecType(type.value)}
                  >
                    {type.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className='flex justify-end gap-3 pt-4'>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!specUrl.trim() || !specType}
            className='flex items-center gap-2'
          >
            <Link2 size={16} />
            Add API Spec
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
