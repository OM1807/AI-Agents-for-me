'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionWrapper from '@/components/shared/SectionWrapper';
import { useProject } from '@/hooks/useProject';
import { ApiSpecList } from './ApiSpecList';
import { ApiSpecUrlModal } from './ApiSpecUrlModal';
import { ApiSpecComponentProps, UploadedFile } from '@/types/agent-api-suite';
import { FileIcon, LinkIcon } from '@/components/icons';
import { toast } from 'sonner';
import { FileUploadModal } from '@/components/shared/FileUploadModal';

export function ConnectApiSpecs({ className }: ApiSpecComponentProps) {
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const { apiSpecs, removeApiSpec, toggleApiSpec, addApiSpec } = useProject();

  const hasSpecs = apiSpecs.specs.length > 0;

  // Handle file upload button click
  const handleUploadClick = (): void => {
    setShowFileUploadModal(true);
  };

  // Handle uploaded files
  const handleFilesUploaded = (uploadedFiles: UploadedFile[]) => {
    uploadedFiles.forEach(file => {
      const apiSpec = {
        id: `spec-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: 'file' as const,
        source: file.name,
        size: file.size || 0,
        version: '1.0.0',
        specType: detectSpecType(file.name),
        description: `Uploaded API specification: ${file.name}`,
      };

      addApiSpec(apiSpec);
    });

    setShowFileUploadModal(false);
    toast.success(`Successfully uploaded ${uploadedFiles.length} API spec(s)!`);
  };

  const detectSpecType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension === 'json') {
      return 'JSON';
    } else if (extension === 'yaml' || extension === 'yml') {
      return 'YAML';
    }
    return '';
  };

  return (
    <div className={className}>
      <SectionWrapper
        icon={<FileIcon className='h-4 w-4' />}
        title='Connect API Specs'
      >
        {!hasSpecs ? (
          <div className='space-y-6 rounded-lg border border-dashed border-gray-300 p-6'>
            {/* Main upload area */}
            <div className='flex flex-col items-center justify-center py-8'>
              <div className='space-y-4 text-center'>
                <div className='mx-auto flex h-13 w-13 items-center justify-center rounded-full'>
                  <LinkIcon className='h-10 w-110 text-gray-600' />
                </div>
                <div>
                  <h3 className='font-outfit text-xl font-medium text-gray-900'>
                    Add Your API Specs
                  </h3>
                  <p className='font-outfit mt-1 text-sm text-gray-500'>
                    Upload or paste your API specs to let AI generate automated
                    tests.
                  </p>
                </div>
                <Button
                  onClick={handleUploadClick}
                  className='h-[48px] w-[290px] bg-[#11054C] px-6 py-2 text-white hover:bg-[#11054C]/90'
                >
                  <Upload className='mr-2 h-4 w-4' />
                  Upload API Specs
                </Button>
              </div>
            </div>

            {/* Or divider */}
            <div className='mt-[-43px] mb-4 flex justify-center text-sm'>
              <span className='text-gray-500'>Or</span>
            </div>

            {/* Paste URL button */}
            <div className='flex justify-center'>
              <Button
                variant='outline'
                onClick={() => setShowUrlModal(true)}
                className='h-[48px] w-[290px] px-6 py-2 text-[16px] font-medium text-[#4A20F5]'
              >
                <LinkIcon className='h-4 w-4' />
                Paste API Spec URL
              </Button>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* API Specs List */}
            <ApiSpecList
              specs={apiSpecs.specs}
              selectedSpecs={apiSpecs.selectedSpecs}
              onToggleSpec={toggleApiSpec}
              onRemoveSpec={removeApiSpec}
            />
          </div>
        )}

        {/* API Spec URL Modal */}
        <ApiSpecUrlModal open={showUrlModal} onOpenChange={setShowUrlModal} />

        {/* File Upload Modal */}
        <FileUploadModal
          open={showFileUploadModal}
          onOpenChange={setShowFileUploadModal}
          onFilesUploaded={handleFilesUploaded}
          acceptedFileTypes={['.json', '.yaml', '.yml']}
          fileTypeDescription='API Specification files (JSON, YAML)'
        />
      </SectionWrapper>
    </div>
  );
}
