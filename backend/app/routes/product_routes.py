from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.database import models
from app.database.db import get_db
from app.utils.deps import get_current_user, get_owner_user

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def get_all_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Product).filter(models.Product.is_active == True)
    if search:
        query = query.filter(models.Product.rice_type.ilike(f"%{search}%"))
    if category:
        query = query.filter(models.Product.category == category)
    return query.all()

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Product).filter(models.Product.product_id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p

@router.post("/", response_model=ProductResponse)
def create_product(data: ProductCreate, db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    product = models.Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    # auto-create inventory row
    inv = models.Inventory(product_id=product.product_id, stock_available=data.stock_quantity)
    db.add(inv)
    db.commit()
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    p = db.query(models.Product).filter(models.Product.product_id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    p = db.query(models.Product).filter(models.Product.product_id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    p.is_active = False
    db.commit()
    return {"message": "Product deactivated"}