from sqlalchemy.orm import Session
from app.models.credit_sale import CreditSale
from app.models.credit_payment import CreditPayment
from app.models.product import Product
from app.schemas.credit_sale import CreditSaleCreate, CreditPaymentCreate
from fastapi import HTTPException

def create_credit_sale(db: Session, credit_sale: CreditSaleCreate):
    total_val = credit_sale.total_value
    
    if credit_sale.product_id:
        product = db.query(Product).filter(Product.id == credit_sale.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        if product.quantity < credit_sale.quantity:
            raise HTTPException(status_code=400, detail="Not enough inventory")
            
        total_val = product.selling_price * credit_sale.quantity
        # Update inventory
        product.quantity -= credit_sale.quantity
    elif total_val is None:
        raise HTTPException(status_code=400, detail="Must provide product or total_value")
    
    db_credit = CreditSale(
        customer_name=credit_sale.customer_name,
        product_id=credit_sale.product_id,
        quantity=credit_sale.quantity,
        total_value=total_val,
        paid_amount=0.0,
        status="PENDING"
    )
    
    db.add(db_credit)
    db.commit()
    db.refresh(db_credit)
    return db_credit

def get_credit_sales(db: Session, skip: int = 0, limit: int = 100):
    return db.query(CreditSale).order_by(
        (CreditSale.status == "PAID").asc(), 
        CreditSale.sale_date.desc()
    ).offset(skip).limit(limit).all()

def add_credit_payment(db: Session, credit_id: int, payment: CreditPaymentCreate):
    db_credit = db.query(CreditSale).filter(CreditSale.id == credit_id).first()
    if not db_credit:
        raise HTTPException(status_code=404, detail="Credit sale not found")
        
    # Validation against overpayment
    remaining = db_credit.total_value - db_credit.paid_amount
    if payment.amount > remaining + 0.01: # 0.01 for float margin
        raise HTTPException(status_code=400, detail="Payment amount exceeds remaining balance")
        
    db_payment = CreditPayment(
        credit_sale_id=credit_id,
        amount=payment.amount,
        payment_method=payment.payment_method
    )
    db.add(db_payment)
    
    db_credit.paid_amount += payment.amount
    
    # Update Status
    if abs(db_credit.total_value - db_credit.paid_amount) < 0.01:
        db_credit.status = "PAID"
    else:
        db_credit.status = "PARTIAL"
        
    db.commit()
    db.refresh(db_credit)
    return db_credit

def revert_credit_payment(db: Session, payment_id: int):
    # Find payment
    payment = db.query(CreditPayment).filter(CreditPayment.id == payment_id).first()
    if not payment:
         raise HTTPException(status_code=404, detail="Payment not found")
         
    credit_sale = payment.credit_sale
    
    # Revert values
    credit_sale.paid_amount -= payment.amount
    if credit_sale.paid_amount <= 0:
        credit_sale.paid_amount = 0.0
        credit_sale.status = "PENDING"
    else:
        credit_sale.status = "PARTIAL"
        
    db.delete(payment)
    db.commit()
    db.refresh(credit_sale)
    return credit_sale

def delete_credit_sale(db: Session, credit_id: int):
    # Completely remove fiado. Similar to deleting a sale, revert inventory.
    db_credit = db.query(CreditSale).filter(CreditSale.id == credit_id).first()
    if not db_credit:
        raise HTTPException(status_code=404, detail="Credit not found")
        
    if db_credit.product_id:
        product = db.query(Product).filter(Product.id == db_credit.product_id).first()
        if product:
             product.quantity += db_credit.quantity
             
    db.delete(db_credit)
    db.commit()
    return {"ok": True}
