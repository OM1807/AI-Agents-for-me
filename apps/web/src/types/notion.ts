import type { ApiError } from './api';
import type { SupportingDocType, PRDBasedType } from './common';
// ========================================
// NOTION TYPES
// ========================================

export interface NotionPage {
  id: string;
  properties: {
    title: {
      id: string;
      type: string;
      title: Array<{
        type: string;
        text: {
          content: string;
          link: string | null;
        };
        annotations?: {
          bold: boolean;
          italic: boolean;
          strikethrough: boolean;
          underline: boolean;
          code: boolean;
          color: string;
        };
        plain_text: string;
        href: string | null;
      }>;
    };
  };
  url: string;
  public_url?: string | null;
  icon?: {
    type: string;
    emoji?: string;
    external?: {
      url: string;
    };
  } | null;
  cover?: {
    type: string;
    external?: {
      url: string;
    };
  } | null;
  created_time: string;
  last_edited_time: string;
  parent: {
    type: string;
    page_id?: string;
    workspace?: boolean;
  };
  archived: boolean;
  in_trash: boolean;
}

export interface SelectedNotionPage {
  id: string;
  url: string;
}

export interface UseNotionResult {
  pages: NotionPage[];
  isLoading: boolean;
  error: ApiError | null;
  searchPages: (query: string) => Promise<void>;
  clearData: () => void;
}

export interface NotionPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (
    selectedPages: NotionPage[],
    pageReferences: { id: string; url: string }[]
  ) => void;
  type: SupportingDocType | PRDBasedType;
}
