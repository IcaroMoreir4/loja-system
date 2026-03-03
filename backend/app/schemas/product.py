from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    name: str
    variation: Optional[str] = None
    quantity: int
    selling_price: float
    cost_price: float

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    variation: Optional[str] = None
    quantity: Optional[int] = None
    selling_price: Optional[float] = None
    cost_price: Optional[float] = None

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True
