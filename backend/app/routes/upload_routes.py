from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import os, uuid
from app.utils.deps import get_owner_user

router = APIRouter()

UPLOAD_DIR = "static/product_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 5

@router.post("/product-image")
async def upload_product_image(file: UploadFile = File(...), owner=Depends(get_owner_user)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, GIF allowed")

    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_SIZE_MB}MB")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    image_url = f"/static/product_images/{filename}"
    return {"image_url": image_url, "filename": filename}
