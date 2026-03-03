from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import sale as schemas
from app.services import sale_service

router = APIRouter()

@router.post("/", response_model=schemas.SaleResponse)
def create_sale(sale: schemas.SaleCreate, db: Session = Depends(get_db)):
    return sale_service.create_sale(db=db, sale=sale)

@router.get("/", response_model=List[schemas.SaleResponse])
def read_sales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return sale_service.get_sales(db, skip=skip, limit=limit)

@router.delete("/{sale_id}")
def delete_sale(sale_id: int, db: Session = Depends(get_db)):
    return sale_service.delete_sale(db=db, sale_id=sale_id)
