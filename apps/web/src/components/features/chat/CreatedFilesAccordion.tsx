'use client';

import React, { useCallback } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import {
  Download,
  Brain,
  FileText,
  Code,
  FileCode,
  Package,
  Building2,
  Network,
  Cpu,
  Blocks,
  Database,
  Shield,
  Settings,
  FileJson,
  Copy,
  Check,
} from 'lucide-react';

export interface CreatedFileItem {
  path: string;
  content: string;
  timestamp: Date;
  type: string;
}

interface CreatedFilesAccordionProps {
  createdFiles: CreatedFileItem[];
}

export function CreatedFilesAccordion({
  createdFiles,
}: CreatedFilesAccordionProps) {
  const [copiedPath, setCopiedPath] = React.useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = React.useState<string[]>(
    createdFiles.length > 0 ? [createdFiles[0].path] : []
  );

  const handleCopyFile = async (file: CreatedFileItem) => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopiedPath(file.path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (err) {
      // Silently fail; copying is auxiliary
      console.error('Failed to copy file content', err);
    }
  };
  const getDocumentType = (filePath: string): string => {
    const fileName = filePath.toLowerCase();

    if (fileName.includes('architecture') || fileName.includes('arch'))
      return 'architecture';
    if (
      fileName.includes('api') ||
      fileName.includes('endpoint') ||
      fileName.includes('route')
    )
      return 'api';
    if (fileName.includes('system') && fileName.includes('design'))
      return 'system-design';
    if (fileName.includes('component') || fileName.includes('registry'))
      return 'component';
    if (
      fileName.includes('dependency') ||
      fileName.includes('dependencies') ||
      fileName.includes('package')
    )
      return 'dependency';
    if (
      fileName.includes('database') ||
      fileName.includes('schema') ||
      fileName.includes('model')
    )
      return 'database';
    if (fileName.includes('security') || fileName.includes('auth'))
      return 'security';
    if (fileName.includes('config') || fileName.includes('setting'))
      return 'config';
    if (
      fileName.includes('ai') ||
      fileName.includes('ml') ||
      fileName.includes('model')
    )
      return 'ai';
    if (fileName.includes('network') || fileName.includes('infrastructure'))
      return 'network';
    if (fileName.includes('.json')) return 'json';
    if (fileName.includes('.md')) return 'markdown';

    return 'default';
  };

  const getFileIcon = (filePath: string): React.ReactNode => {
    const docType = getDocumentType(filePath);

    switch (docType) {
      case 'architecture':
        return <Building2 className='h-4 w-4 text-purple-600' />;
      case 'api':
        return <Code className='h-4 w-4 text-blue-600' />;
      case 'system-design':
        return <Network className='h-4 w-4 text-green-600' />;
      case 'component':
        return <Blocks className='h-4 w-4 text-orange-600' />;
      case 'dependency':
        return <Package className='h-4 w-4 text-yellow-600' />;
      case 'database':
        return <Database className='h-4 w-4 text-indigo-600' />;
      case 'security':
        return <Shield className='h-4 w-4 text-red-600' />;
      case 'config':
        return <Settings className='h-4 w-4 text-gray-600' />;
      case 'ai':
        return <Brain className='h-4 w-4 text-pink-600' />;
      case 'network':
        return <Cpu className='h-4 w-4 text-teal-600' />;
      case 'json':
        return <FileJson className='h-4 w-4 text-green-600' />;
      case 'markdown':
        return <FileText className='h-4 w-4 text-gray-600' />;
      default:
        return <FileCode className='h-4 w-4 text-gray-500' />;
    }
  };

  const formatFileName = (filePath: string): string => {
    const fileName = filePath.split('/').pop() || filePath;
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    return (
      nameWithoutExt
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ') || 'Untitled'
    );
  };

  const handleDownloadFile = useCallback((file: CreatedFileItem) => {
    try {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.path.split('/').pop() || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }, []);

  return (
    <div className='flex-1 space-y-2 overflow-y-auto'>
      <Accordion
        type='multiple'
        value={expandedFiles}
        onValueChange={setExpandedFiles}
      >
        {createdFiles.map(file => (
          <AccordionItem key={file.path} value={file.path}>
            <AccordionTrigger>
              <>
                <div className='flex items-center gap-2'>
                  {getFileIcon(file.path)}
                  <span className='text-sm font-medium text-gray-900'>
                    {formatFileName(file.path)}
                  </span>
                </div>
                <div className='mr-2 ml-auto flex items-center gap-1'>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleCopyFile(file);
                    }}
                    title='Copy content'
                    aria-label='Copy content'
                    className='rounded p-1.5 transition-colors hover:bg-gray-200 active:scale-95'
                  >
                    {copiedPath === file.path ? (
                      <Check className='h-3.5 w-3.5 text-green-600' />
                    ) : (
                      <Copy className='h-3.5 w-3.5 text-gray-600' />
                    )}
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDownloadFile(file);
                    }}
                    title='Download file'
                    aria-label='Download file'
                    className='rounded p-1.5 transition-colors hover:bg-gray-200 active:scale-95'
                  >
                    <Download className='h-3.5 w-3.5 text-gray-600' />
                  </button>
                </div>
              </>
            </AccordionTrigger>
            <AccordionContent>
              <div className='prose prose-base prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 max-h-[250px] max-w-none overflow-y-auto px-6 py-4'>
                <MarkdownRenderer content={file.content} />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export default CreatedFilesAccordion;
