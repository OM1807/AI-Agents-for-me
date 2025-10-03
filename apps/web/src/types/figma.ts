// ========================================
// FIGMA TYPES
// ========================================

export interface FigmaFile {
  name: string;
  folder_name?: string;
  last_touched_at: string;
  creator?: {
    id: string;
    handle: string;
    img_url: string;
  };
  last_touched_by?: {
    id: string;
    handle: string;
    img_url: string;
  };
  thumbnail_url?: string;
  editorType: string;
  version: string;
  role: string;
  link_access: string;
  url: string;
}
