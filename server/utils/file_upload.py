import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException
from typing import List
from pathlib import Path

# Configuration
UPLOAD_BASE_DIR = "uploads"  # ✅ Change from "uploads" to "server/uploads"
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Create base upload directory
os.makedirs(UPLOAD_BASE_DIR, exist_ok=True)

async def save_upload_file(file: UploadFile, subfolder: str = "") -> str:
    """Save uploaded file and return RELATIVE path (from uploads folder)"""
    
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    # Validate file size
    file.file.seek(0, 2)  # Seek to end of file
    file_size = file.file.tell()
    file.file.seek(0)  # Reset file pointer
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File size too large. Maximum allowed: {MAX_FILE_SIZE//1024//1024}MB")
    
    # Create unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Build file path
    if subfolder:
        # Create subfolder path
        full_subfolder = os.path.join(UPLOAD_BASE_DIR, subfolder)
        relative_path = os.path.join(subfolder, unique_filename)  # ✅ Relative path
        full_path = os.path.join(full_subfolder, unique_filename)  # Full filesystem path
        
        # Create subfolder if not exists
        os.makedirs(full_subfolder, exist_ok=True)
    else:
        relative_path = unique_filename  # ✅ Relative path
        full_path = os.path.join(UPLOAD_BASE_DIR, unique_filename)  # Full filesystem path
    
    print(f"🔍 Saving file: {full_path}")
    print(f"🔍 Relative path for DB: {relative_path}")
    
    # Save file
    try:
        with open(full_path, "wb") as buffer:
            # Read file in chunks to handle large files
            chunk_size = 1024 * 1024  # 1MB chunks
            while chunk := await file.read(chunk_size):
                buffer.write(chunk)
        
        print(f"✅ File saved successfully: {full_path}")
        
        # ✅ Return relative path (for database storage)
        return relative_path
        
    except Exception as e:
        print(f"❌ Error saving file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

async def delete_file(file_path: str):
    """Delete file from server"""
    try:
        # Handle both full URLs and relative paths
        if not file_path:
            return
            
        # Remove URL prefix if present
        if file_path.startswith("http://localhost:8000/uploads/"):
            file_path = file_path.replace("http://localhost:8000/uploads/", "")
        
        # Remove leading slash or backslash
        file_path = file_path.lstrip("/").lstrip("\\")
        
        # Construct full path
        full_path = os.path.join(UPLOAD_BASE_DIR, file_path)
        
        # Normalize path (handle .. and other path manipulations)
        full_path = os.path.normpath(full_path)
        
        # Security check: ensure path is within upload directory
        if not full_path.startswith(os.path.abspath(UPLOAD_BASE_DIR)):
            print(f"⚠️ Security warning: Attempt to delete file outside upload directory: {file_path}")
            return
        
        if os.path.exists(full_path):
            os.remove(full_path)
            print(f"✅ File deleted: {full_path}")
        else:
            print(f"⚠️ File not found: {full_path}")
            
    except Exception as e:
        print(f"❌ Error deleting file {file_path}: {e}")

def get_full_url(relative_path: str) -> str:
    """Convert relative path to full HTTP URL"""
    if not relative_path:
        return ""
    
    # Clean the path
    clean_path = relative_path.replace("\\", "/").lstrip("/")
    
    # Construct full URL
    base_url = "http://localhost:8000"  # You can make this configurable
    return f"{base_url}/uploads/{clean_path}"

# Helper functions for validation
def is_allowed_image(filename: str) -> bool:
    """Check if file is an allowed image type"""
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_IMAGE_EXTENSIONS

def is_allowed_video(filename: str) -> bool:
    """Check if file is an allowed video type"""
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_VIDEO_EXTENSIONS

async def save_multiple_files(files: List[UploadFile], subfolder: str = "") -> List[str]:
    """Save multiple uploaded files"""
    saved_paths = []
    
    for file in files:
        try:
            relative_path = await save_upload_file(file, subfolder)
            saved_paths.append(relative_path)
        except Exception as e:
            # If one file fails, delete all previously saved files
            for path in saved_paths:
                await delete_file(path)
            raise HTTPException(status_code=500, detail=f"Failed to save files: {str(e)}")
    
    return saved_paths

# Test function (optional)
async def test_file_upload():
    """Test the file upload functionality"""
    test_dir = os.path.join(UPLOAD_BASE_DIR, "test")
    os.makedirs(test_dir, exist_ok=True)
    
    # Create a test file
    test_content = b"Test file content"
    test_filename = "test_file.txt"
    test_path = os.path.join(test_dir, test_filename)
    
    with open(test_path, "wb") as f:
        f.write(test_content)
    
    print(f"Test file created: {test_path}")
    return test_path