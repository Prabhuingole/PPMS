import magic
from fastapi import HTTPException, UploadFile, status

async def validate_file_type(file: UploadFile, allowed_mime_types: list[str]) -> None:
    """
    Validates that the uploaded file's magic numbers match one of the allowed MIME types.
    """
    if not file.file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is missing."
        )

    # Read the first 2048 bytes for magic number detection
    header = await file.read(2048)
    
    # Seek back to the beginning so the file can be processed later
    await file.seek(0)
    
    if not header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty."
        )

    # Determine MIME type using python-magic
    mime_type = magic.from_buffer(header, mime=True)
    
    if mime_type not in allowed_mime_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {mime_type}. Allowed types: {', '.join(allowed_mime_types)}."
        )
