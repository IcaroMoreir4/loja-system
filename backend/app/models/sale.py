from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from app.database import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    total_value = Column(Float, default=0.0)
    # Storing multiple payment methods. e.g [{"method": "PIX", "amount": 10}, {"method": "Fiado", "amount": 10}]
    # We use JSON since Supabase is Postgres
    payment_methods = Column(JSON, default=list) 
    sale_date = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product")
