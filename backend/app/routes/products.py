from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import product as schemas
from app.services import product_service

router = APIRouter()

@router.post("/", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return product_service.create_product(db=db, product=product)

@router.get("/", response_model=List[schemas.ProductResponse])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return product_service.get_products(db, skip=skip, limit=limit)

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = product_service.get_product(db, product_id=product_id)
    if db_product is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    return product_service.update_product(db=db, product_id=product_id, product_update=product)

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    return product_service.delete_product(db=db, product_id=product_id)
