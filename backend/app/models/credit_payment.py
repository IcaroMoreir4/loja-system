from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CreditPayment(Base):
    __tablename__ = "credit_payments"

    id = Column(Integer, primary_key=True, index=True)
    credit_sale_id = Column(Integer, ForeignKey("credit_sales.id"))
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False) # PIX, CASH, CARD
    payment_date = Column(DateTime(timezone=True), server_default=func.now())

    credit_sale = relationship("CreditSale", back_populates="payments")
