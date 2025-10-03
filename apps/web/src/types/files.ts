export interface FileUploadResponse {
  file_name: string;
}

export interface FileDeleteResponse {
  success: boolean;
  message: string;
  file_name: string;
}
