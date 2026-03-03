from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.services import report_service

router = APIRouter()

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    return report_service.get_dashboard_summary(db=db)

@router.get("/pending-credits")
def get_pending_credits(db: Session = Depends(get_db)):
    # Returns raw credit models, which we can parse dynamically in FastAPI 
    # but let's use the actual response schema internally if possible, or build it.
    from app.schemas.credit_sale import CreditSaleResponse
    from app.models.credit_sale import CreditSale
    
    pending = report_service.get_pending_credits(db=db)
    return pending
