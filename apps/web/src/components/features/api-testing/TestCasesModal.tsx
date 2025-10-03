'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BookOpenText, Upload, X } from 'lucide-react';
import { JiraIcon } from '@/components/icons';
import { useOAuth } from '@/hooks/useOAuth';
import { useProject } from '@/hooks/useProject';
import { TestCasesModalProps } from '@/types/agent-api-suite';
import { FileUploadModal } from '@/components/shared/FileUploadModal';
import { UploadedFile } from '@/types/agent-api-suite';
import { toast } from 'sonner';

export function TestCasesModal({ open, onOpenChange }: TestCasesModalProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const { atlassianMCPConnection } = useOAuth();
  const { addTestCase } = useProject();

  const handleConnect = (provider: string) => {
    if (provider === 'atlassian-mcp') {
      // Redirect to Atlassian OAuth flow
      window.location.href = `/api/auth/${provider}?from=${window.location.href}`;
      return;
    }

    if (provider === 'upload') {
      setShowFileUploadModal(true);
      return;
    }

    setLoadingProvider(provider);
  };

  // Handle uploaded files
  const handleFilesUploaded = (uploadedFiles: UploadedFile[]) => {
    uploadedFiles.forEach(file => {
      const testCase = {
        id: `testcase-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: 'file' as const,
        source: file.name,
        size: file.size || 0,
      };

      addTestCase(testCase);
    });

    setShowFileUploadModal(false);
    onOpenChange(false);
    toast.success(
      `Successfully uploaded ${uploadedFiles.length} test case file(s)!`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='relative sm:max-w-[600px]'>
        <DialogHeader className='relative'>
          <DialogTitle className='flex items-center gap-3 pr-8 text-2xl'>
            <span className='text-2xl'>
              <BookOpenText className='h-7 w-7' />
            </span>
            Connect Test Cases
          </DialogTitle>
          <DialogDescription className='pt-2 text-sm'>
            Link or upload a Test Cases or link your Test Cases Data Source to
            help the AI understand what to automate tests.
          </DialogDescription>

          {/* Custom close button */}
          <button
            onClick={() => onOpenChange(false)}
            className='absolute top-0 right-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none'
          >
            <X className='h-4 w-4' />
            <span className='sr-only'>Close</span>
          </button>
        </DialogHeader>

        <div className='mt-6 space-y-4'>
          {/* Atlassian (Jira) Option */}
          <button
            onClick={() => handleConnect('atlassian-mcp')}
            disabled={atlassianMCPConnection.isConnected}
            className='flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <div className='flex items-center gap-4'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
                <JiraIcon className='h-6 w-6' />
              </div>
              <div className='text-left'>
                <h3 className='text-lg font-semibold'>Connect to Atlassian</h3>
                <p className='text-muted-foreground text-sm'>
                  {atlassianMCPConnection.isConnected
                    ? 'Connected - Access Jira test cases'
                    : 'Import test cases from Jira'}
                </p>
              </div>
            </div>
            <div className='text-gray-400'>→</div>
          </button>

          {/* Upload Option */}
          <button
            onClick={() => handleConnect('upload')}
            disabled={loadingProvider === 'upload'}
            className='flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <div className='flex items-center gap-4'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
                <Upload className='h-6 w-6 text-gray-600' />
              </div>
              <div className='text-left'>
                <h3 className='text-lg font-semibold'>
                  Upload Your Test Cases
                </h3>
                <p className='text-muted-foreground text-sm'>
                  {loadingProvider === 'upload'
                    ? 'Uploading...'
                    : 'Upload documents from your device (.csv, .xlsx, .docx, .json, .txt)'}
                </p>
              </div>
            </div>
            <div className='text-gray-400'>→</div>
          </button>
        </div>

        {/* File Upload Modal */}
        <FileUploadModal
          open={showFileUploadModal}
          onOpenChange={setShowFileUploadModal}
          onFilesUploaded={handleFilesUploaded}
          acceptedFileTypes={['.csv', '.xlsx', '.docx', '.json', '.txt']}
          fileTypeDescription='Test case files (CSV, Excel, Word, JSON, Text)'
        />
      </DialogContent>
    </Dialog>
  );
}
