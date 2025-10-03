'use client';

import React, { useState, useRef } from 'react';
import { X, Check, AlertCircle, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUser } from '@/hooks/useUser';
import { filesUploadApi } from '@/lib/api/api';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  name: string;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
  size?: number;
  type?: string;
  file?: File;
}

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesUploaded?: (files: UploadedFile[]) => void;
  acceptedFileTypes?: string[];
  fileTypeDescription?: string;
}

export function FileUploadModal({
  open,
  onOpenChange,
  onFilesUploaded,
  acceptedFileTypes = ['.pdf', '.doc', '.docx'],
  fileTypeDescription = 'PDF, DOC, or DOCX files',
}: FileUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { accessToken } = useUser();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const validateFileType = (file: File): boolean => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return acceptedFileTypes.includes(fileExtension);
  };

  const generateFileId = (suffix?: string | number): string => {
    const timestamp = Date.now();
    const uniqueSuffix = suffix !== undefined ? suffix : Math.random();
    return `file-${timestamp}-${uniqueSuffix}`;
  };

  const generateFileMetadata = (file: File): UploadedFile => {
    return {
      id: generateFileId(),
      name: file.name,
      status: 'uploading',
      size: file.size,
      type: file.type,
      file: file,
    };
  };

  const generateUploadedFileMetadata = (
    uploadedFileNames: string[],
    originalFiles: File[]
  ): UploadedFile[] => {
    return uploadedFileNames.map((fileName, index) => ({
      id: generateFileId(index),
      name: fileName, // Use the actual uploaded filename from API
      status: 'completed' as const,
      size: originalFiles[index]?.size || 0,
      type: originalFiles[index]?.type || '',
      file: originalFiles[index],
    }));
  };

  const processFileUploads = async (
    validFiles: File[]
  ): Promise<UploadedFile[]> => {
    // Create initial file metadata for UI state
    const tempFiles = validFiles.map(file => generateFileMetadata(file));
    setUploadedFiles(prev => [...prev, ...tempFiles]);

    // Use parallel uploads with Promise.allSettled
    const uploadPromises = validFiles.map(file =>
      filesUploadApi.upload([file], accessToken!)
    );

    const results = await Promise.allSettled(uploadPromises);

    const uploadedFileNames: string[] = [];
    const errors: string[] = [];

    // Process results and update UI state
    results.forEach((result, index) => {
      const file = validFiles[index];

      if (
        result.status === 'fulfilled' &&
        result.value.success &&
        result.value.data
      ) {
        uploadedFileNames.push(result.value.data.file_name);
        // Update file status to completed
        setUploadedFiles(prev =>
          prev.map(f =>
            f.name === file.name ? { ...f, status: 'completed' as const } : f
          )
        );
      } else {
        // Handle errors
        const errorMessage =
          result.status === 'rejected'
            ? result.reason?.message || 'Upload failed'
            : result.value.error || 'Upload failed';

        errors.push(`${file.name}: ${errorMessage}`);
        // Update file status to error
        setUploadedFiles(prev =>
          prev.map(f =>
            f.name === file.name ? { ...f, status: 'error' as const } : f
          )
        );
      }
    });

    // Handle errors
    if (errors.length > 0) {
      if (errors.length === validFiles.length) {
        // All files failed
        throw new Error(`All uploads failed:\n${errors.join('\n')}`);
      } else {
        // Some files failed, show warning
        toast.warning(
          `${errors.length} file(s) failed to upload:\n${errors.join('\n')}`
        );
      }
    }

    // Filter successful files for metadata generation
    const successfulFiles = validFiles.filter(
      (_, index) =>
        results[index].status === 'fulfilled' &&
        (results[index] as PromiseFulfilledResult<any>).value.success
    );

    return generateUploadedFileMetadata(uploadedFileNames, successfulFiles);
  };

  const handleFilesProcessing = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file: File) => {
      if (!validateFileType(file)) {
        toast.error(
          `File "${file.name}" is not supported. Please upload ${fileTypeDescription} only.`
        );
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      const newFiles = await processFileUploads(validFiles);
      if (onFilesUploaded) {
        onFilesUploaded(newFiles);
      }
    } catch (error) {
      toast.error(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      await handleFilesProcessing(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files) {
      await handleFilesProcessing(files);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[80vh] flex-col overflow-hidden'>
        <DialogHeader className='flex-shrink-0'>
          <DialogTitle className='flex items-center gap-2 text-xl font-semibold'>
            Upload Files
          </DialogTitle>
        </DialogHeader>

        {/* Custom close button */}
        <button
          onClick={() => onOpenChange(false)}
          className='ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none'
        >
          <X className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </button>

        {/* Content area */}
        <div className='flex-1 overflow-y-auto'>
          <div className='space-y-6'>
            {/* File Upload Area */}
            <div
              className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                isDragOver
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400'
              } `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className='flex flex-col items-center space-y-4'>
                {/* Upload Icon */}
                <Upload className='h-12 w-12 text-purple-600' />

                {/* Main Text */}
                <div className='space-y-2'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Drag and drop your files here, or click to browse
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Upload your files or paste the content directly
                  </p>
                </div>

                {/* Choose File Button */}
                <button
                  onClick={handleFileSelect}
                  className='rounded-md bg-[#11054C] px-6 py-3 font-medium text-white'
                >
                  Choose File
                </button>

                {/* Supported Formats */}
                <p className='text-sm text-gray-400'>
                  Supports: {fileTypeDescription}
                </p>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type='file'
                multiple
                accept={acceptedFileTypes.join(',')}
                onChange={handleFileChange}
                className='hidden'
              />
            </div>
            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className='space-y-3'>
                {uploadedFiles.map(file => (
                  <div
                    key={file.id}
                    className='flex items-center space-x-3 rounded-lg bg-gray-50 p-3'
                  >
                    {/* File Status Icon */}
                    <div className='flex-shrink-0'>
                      {file.status === 'completed' ? (
                        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-green-500'>
                          <Check size={16} className='text-white' />
                        </div>
                      ) : file.status === 'error' ? (
                        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-red-500'>
                          <AlertCircle size={16} className='text-white' />
                        </div>
                      ) : (
                        <div className='flex h-6 w-6 animate-spin items-center justify-center rounded-full border-2 border-purple-300'>
                          <div className='h-2 w-2 rounded-full bg-purple-600'></div>
                        </div>
                      )}
                    </div>

                    {/* File Name */}
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium text-gray-900'>
                        {file.name}
                      </p>
                      {file.status === 'uploading' && file.progress && (
                        <div className='mt-1 h-1 w-full rounded-full bg-gray-200'>
                          <div
                            className='h-1 rounded-full bg-purple-600 transition-all duration-300'
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
