from imagekitio import ImageKit
from config import IMAGEKIT_PRIVATE_KEY

imagekit = ImageKit(private_key=IMAGEKIT_PRIVATE_KEY)

def upload_file(file_bytes: bytes, file_name: str, folder:str) -> str:
    """Upload File to imagekit and return the CDN URL."""

    results = imagekit.files.upload(
        file=file_bytes,
        file_name=file_name,
        folder=folder,
        is_private_file=False,
        use_unique_file_name=True
    )
    return results.url

def get_variants(base_url: str) -> dict:
    """Return 3 sizes variant URLs using imagekit transformation"""
    return {
        "youtube": f"{base_url}?tr=w-1280,h-720,c-maintain_ratio,fo-auto",
        "shorts": f"{base_url}?tr=w-1080,h-1920,c-maintain_ratio,fo-auto",
        "square": f"{base_url}?tr=w-1080,h-1080,c-maintain_ratio,fo-auto",
    }
    