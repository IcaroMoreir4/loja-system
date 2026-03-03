from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import credit_sale as schemas
from app.services import credit_service

router = APIRouter()

@router.post("/", response_model=schemas.CreditSaleResponse)
def create_credit_sale(credit_sale: schemas.CreditSaleCreate, db: Session = Depends(get_db)):
    return credit_service.create_credit_sale(db=db, credit_sale=credit_sale)

@router.get("/", response_model=List[schemas.CreditSaleResponse])
def read_credit_sales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return credit_service.get_credit_sales(db, skip=skip, limit=limit)

@router.post("/{credit_id}/payments", response_model=schemas.CreditSaleResponse)
def add_payment(credit_id: int, payment: schemas.CreditPaymentCreate, db: Session = Depends(get_db)):
    return credit_service.add_credit_payment(db=db, credit_id=credit_id, payment=payment)

@router.delete("/payments/{payment_id}", response_model=schemas.CreditSaleResponse)
def revert_payment(payment_id: int, db: Session = Depends(get_db)):
    return credit_service.revert_credit_payment(db=db, payment_id=payment_id)
    
@router.delete("/{credit_id}")
def delete_credit(credit_id: int, db: Session = Depends(get_db)):
    return credit_service.delete_credit_sale(db=db, credit_id=credit_id)
