import { useState, useCallback } from 'react';
import { figmaApi } from '@/lib/api/api';
import { FigmaFile, ApiError } from '@/types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

interface FigmaApiResponse {
  file: FigmaFile;
}

export interface UseFigmaResult {
  files: FigmaFile[];
  isLoading: boolean;
  error: ApiError | null;
  getFileMetadata: (fileId: string) => Promise<FigmaFile | null>;
  clearData: () => void;
}

export const useFigma = (): UseFigmaResult => {
  const [files, setFiles] = useState<FigmaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const { accessToken } = useUser();

  // Get file metadata for a specific Figma file
  const getFileMetadata = useCallback(
    async (fileId: string): Promise<FigmaFile | null> => {
      if (!accessToken) {
        const error = {
          message: 'Please log in to access Figma files',
          status: 401,
        };
        setError(error);
        toast.error(error.message);
        return null;
      }

      if (!fileId || fileId.trim() === '') {
        const error = {
          message: 'File ID is required',
          status: 400,
        };
        setError(error);
        toast.error(error.message);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await figmaApi.getFileMetadata(fileId, accessToken);

        if (response.success && response.data) {
          // Extract file data from the API response wrapper
          let fileData: FigmaFile;

          // Handle response structure: either wrapped in {file: {...}} or direct object
          if (typeof response.data === 'object' && 'file' in response.data) {
            fileData = (response.data as FigmaApiResponse).file;
          } else {
            fileData = response.data as FigmaFile;
          }

          // Add to files list if not already present
          setFiles(prev => {
            const exists = prev.some(file => file.url === fileData.url);
            if (!exists) {
              return [...prev, fileData];
            }
            return prev;
          });

          return fileData;
        } else {
          throw new Error(response.error || 'Failed to get file metadata');
        }
      } catch (error) {
        const apiError = error as ApiError;

        // Provide more specific error messages
        if (apiError.status === 401) {
          apiError.message =
            'Authentication failed. Please reconnect your Figma account.';
        } else if (apiError.status === 403) {
          apiError.message =
            'Access denied. Please ensure your Figma token has the necessary permissions.';
        } else if (apiError.status === 404) {
          apiError.message =
            'Figma file not found. Please check the file ID and try again.';
        } else if (!apiError.message) {
          apiError.message =
            'Failed to get Figma file metadata. Please try again.';
        }

        setError(apiError);
        toast.error(apiError.message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  // Clear all data
  const clearData = useCallback(() => {
    setFiles([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    files,
    isLoading,
    error,
    getFileMetadata,
    clearData,
  };
};
