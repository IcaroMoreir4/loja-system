from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class CreditPaymentBase(BaseModel):
    amount: float
    payment_method: str

class CreditPaymentResponse(CreditPaymentBase):
    id: int
    credit_sale_id: int
    payment_date: datetime

    class Config:
        from_attributes = True

class CreditSaleBase(BaseModel):
    customer_name: str
    product_id: Optional[int] = None
    quantity: Optional[int] = 1
    total_value: Optional[float] = None # allowed explicit or calculated by product

class CreditSaleCreate(CreditSaleBase):
    pass

class CreditSaleResponse(CreditSaleBase):
    id: int
    total_value: float
    paid_amount: float
    status: str
    sale_date: datetime
    payments: List[CreditPaymentResponse] = []

    class Config:
        from_attributes = True

class CreditPaymentCreate(BaseModel):
    amount: float
    payment_method: str
