from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CreditSale(Base):
    __tablename__ = "credit_sales"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True) # made nullable if fiado is just generic amount
    quantity = Column(Integer, default=1, nullable=True)
    
    total_value = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    
    status = Column(String, default="PENDING") # PENDING, PARTIAL, PAID
    
    sale_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Optional relation if this fiado comes from a specific sale
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)

    product = relationship("Product")
    payments = relationship("CreditPayment", back_populates="credit_sale", cascade="all, delete-orphan")
