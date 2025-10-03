// ========================================
// HOOK RESULT TYPES
// ========================================

import type {
  AtlassianSpace,
  AtlassianPage,
  AtlassianProject,
  AtlassianIssue,
} from './atlassian';
import type { FigmaFile } from './figma';

export interface UseAtlassianResult {
  spaces: AtlassianSpace[];
  pages: AtlassianPage[];
  projects: AtlassianProject[];
  issues: AtlassianIssue[];
  getSpaces: (spaceKeys?: string[]) => Promise<void>;
  getPages: (spaceKey?: string) => Promise<void>;
  getProjects: () => Promise<void>;
  getIssues: (
    projectKey: string,
    issueType?: string,
    searchQuery?: string
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface UseFigmaResult {
  getFileMetadata: (fileId: string) => Promise<FigmaFile | null>;
  isLoading: boolean;
  error: string | null;
}
