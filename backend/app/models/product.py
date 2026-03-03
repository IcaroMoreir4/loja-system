from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    variation = Column(String, nullable=True)
    quantity = Column(Integer, default=0)
    selling_price = Column(Float, default=0.0)
    cost_price = Column(Float, default=0.0)
