from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any, Optional

class SaleBase(BaseModel):
    product_id: int
    quantity: int
    # payment_methods format: [{"method": "PIX", "amount": 20}, {"method": "CASH", "amount": 30}]
    payment_methods: List[Dict[str, Any]]

class SaleCreate(SaleBase):
    pass

class SaleResponse(SaleBase):
    id: int
    total_value: float
    sale_date: datetime

    class Config:
        from_attributes = True

class PaymentFraction(BaseModel):
    method: str
    amount: float
