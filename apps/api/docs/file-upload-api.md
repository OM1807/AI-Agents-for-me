# File Upload API Documentation

This document describes the file upload functionality for user file storage in the SDLC Agents API.

## Overview

The file upload system allows users to upload files (docx, pdf, csv, doc, txt) to their personal file storage. Files are stored in user-specific directories and can be used across multiple agent sessions.

## Architecture

### File Storage Structure

Files are stored in the following directory structure:
```
{workspace_root}/{user_id}/files/
```

Where:
- `workspace_root`: Configured workspace directory (default: `/tmp/sdlc-agents`)
- `user_id`: ID of the user who owns the files
- `files/`: Subdirectory containing user's uploaded files

### File Naming Strategy

- **Original filename preserved**: Files are stored with their original names
- **Duplicate handling**: If a file with the same name exists, a timestamp is appended
  - Example: `document.pdf` → `document_20250820_143022.pdf`
- **Unique identification**: Each file gets a unique name to prevent conflicts

## API Endpoints

### 1. Upload File

**Endpoint:** `POST /api/v1/files/upload`

**Description:** Upload a file to user's file storage.

**Authentication:** Required (Bearer token)

**Request Body:**
- `file` (required): Multipart form data containing the file

**Response:**
```json
{
    "file_name": "document.pdf"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file type or missing filename
- `413 Request Entity Too Large`: File size exceeds limit
- `401 Unauthorized`: Authentication required
- `500 Internal Server Error`: File upload failed

### 2. Delete User File

**Endpoint:** `DELETE /api/v1/files/user-files/{filename}`

**Description:** Delete a specific file from user's file storage.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `filename` (required): Name of the file to delete

**Response:**
```json
{
    "success": true,
    "message": "File deleted successfully",
    "file_name": "document.pdf"
}
```

**Error Responses:**
- `401 Unauthorized`: Authentication required
- `404 Not Found`: File not found
- `500 Internal Server Error`: File deletion failed

## File Validation

### Supported File Types
- `.docx` - Microsoft Word documents
- `.pdf` - PDF documents
- `.csv` - Comma-separated values files
- `.doc` - Legacy Microsoft Word documents
- `.txt` - Plain text files

### File Size Limits
- Maximum file size: 10MB
- Files exceeding this limit will be rejected with a 413 error

### Security Considerations
- Files are stored with unique timestamps to prevent conflicts
- Only authenticated users can upload/delete their own files
- File paths are validated to prevent directory traversal attacks
- Physical files are automatically cleaned up when deleted

## Usage Examples

### Upload a PDF Document

```bash
curl -X POST "http://localhost:8000/api/v1/files/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"
```

**Response:**
```json
{
    "file_name": "document.pdf"
}
```

### Delete a File

```bash
curl -X DELETE "http://localhost:8000/api/v1/files/user-files/document.pdf" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
    "success": true,
    "message": "File deleted successfully",
    "file_name": "document.pdf"
}
```

### Verify File Exists (Using Delete Endpoint)

```bash
# Try to delete the file - if it exists, you'll get success
# If it doesn't exist, you'll get 404
curl -X DELETE "http://localhost:8000/api/v1/files/user-files/document.pdf" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**If file exists:**
```json
{
    "success": true,
    "message": "File deleted successfully",
    "file_name": "document.pdf"
}
```

**If file doesn't exist:**
```json
{
    "detail": "File not found"
}
```

## Integration with Agent Workflows

Files uploaded to user storage are automatically available to AI agents during their execution:

1. **File Access**: Agents can access user files through the workspace service
2. **Session Integration**: Files are copied to session workspace when needed
3. **Cross-Session Usage**: Files persist across multiple agent sessions
4. **Automatic Cleanup**: Files remain in user storage until manually deleted

## File System Verification

### Check File System Directly

**On macOS/Linux:**
```bash
# Check if file exists
ls -la /tmp/sdlc-agents/{user_id}/files/{filename}

# List all user files
ls -la /tmp/sdlc-agents/{user_id}/files/
```

**On Windows:**
```cmd
# Check if file exists
dir %TEMP%\sdlc-agents\{user_id}\files\{filename}

# List all user files
dir %TEMP%\sdlc-agents\{user_id}\files\
```

### Python Script Verification

```python
import os
from pathlib import Path

# Get temp directory
temp_dir = os.path.join(os.path.expanduser("~"), ".cache", "sdlc-agents")
# Or on some systems:
# temp_dir = "/tmp/sdlc-agents"

# Check for your user's files
user_id = 1  # Replace with your actual user ID
user_files_dir = Path(temp_dir) / str(user_id) / "files"
filename = "document.pdf"

if (user_files_dir / filename).exists():
    print(f"✅ File {filename} exists for user {user_id}")
    print(f"📁 Path: {user_files_dir / filename}")
else:
    print(f"❌ File {filename} not found for user {user_id}")
```

## Error Handling

The API provides comprehensive error handling:

- **Validation Errors**: File type and size validation with clear error messages
- **Authentication Errors**: Proper 401 responses for unauthenticated requests
- **Authorization Errors**: Users can only access their own files
- **File System Errors**: Graceful handling of disk space and permission issues
- **Duplicate Handling**: Automatic timestamp-based filename generation

## Performance Considerations

- **Async Operations**: All file operations are asynchronous for better performance
- **Streaming Uploads**: Files are streamed to disk to handle large files efficiently
- **Duplicate Prevention**: Smart filename generation prevents conflicts
- **Efficient Storage**: Files are stored directly in user directories
