import io
import cloudinary
import cloudinary.uploader
from app.config import settings

# Configure Cloudinary explicitly from settings
if settings.CLOUDINARY_URL:
    cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL)


def upload_pdf_to_cloudinary(file_bytes: bytes, filename: str) -> str:
    """
    Uploads PDF bytes to Cloudinary as a raw file.
    Returns the secure URL of the uploaded file.
    Raises ValueError if Cloudinary is not configured or upload fails.
    """
    if not settings.CLOUDINARY_URL:
        raise ValueError("Cloudinary configuration is missing (CLOUDINARY_URL).")

    try:
        # Wrap bytes in BytesIO and name it appropriately for Cloudinary
        file_io = io.BytesIO(file_bytes)
        file_io.name = filename

        upload_result = cloudinary.uploader.upload(
            file_io,
            resource_type="raw",
            folder="learnnest/materials",
            public_id=filename
        )
        secure_url = upload_result.get("secure_url")
        if not secure_url:
            raise ValueError("No secure URL returned from Cloudinary.")
        return secure_url
    except Exception as e:
        raise ValueError(f"Cloudinary upload failed: {str(e)}")
