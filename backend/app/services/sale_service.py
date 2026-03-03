from sqlalchemy.orm import Session
from app.models.sale import Sale
from app.models.product import Product
from app.models.credit_sale import CreditSale
from app.schemas.sale import SaleCreate
from fastapi import HTTPException

def create_sale(db: Session, sale: SaleCreate):
    product = db.query(Product).filter(Product.id == sale.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if product.quantity < sale.quantity:
        raise HTTPException(status_code=400, detail="Not enough inventory")
        
    total_value = product.selling_price * sale.quantity
    
    # Calculate sum of payments
    payment_sum = sum(p["amount"] for p in sale.payment_methods)
    
    # We might allow payment_sum to be less than total_value if the rest is implicit discount, 
    # but for this logic, we assume user explicitly defines all methods.
    # If a method is "FIADO", we will auto-create a CreditSale record for that portion.
    
    db_sale = Sale(
        product_id=sale.product_id,
        quantity=sale.quantity,
        total_value=total_value,
        payment_methods=sale.payment_methods
    )
    
    # Update inventory
    product.quantity -= sale.quantity
    
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)
    
    # Check for Fiado parts in payment_methods
    for p in sale.payment_methods:
        method_name = p.get("method", "").upper()
        if method_name == "FIADO":
            # auto create credit sale
            # we need a customer name, which might be in the method dict or generic
            customer_name = p.get("customer_name", "Cliente Não Identificado (Venda PDV)")
            db_credit = CreditSale(
                customer_name=customer_name,
                product_id=sale.product_id,
                quantity=1, # fractional representation could be tricky, we just associate the debt
                total_value=p["amount"],
                paid_amount=0.0,
                status="PENDING",
                sale_id=db_sale.id
            )
            db.add(db_credit)
    
    db.commit()
    return db_sale

def get_sales(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Sale).order_by(Sale.sale_date.desc()).offset(skip).limit(limit).all()

def delete_sale(db: Session, sale_id: int):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Optional: if sale had FIADO, remove those credit_sales
    fiados = db.query(CreditSale).filter(CreditSale.sale_id == sale.id).all()
    for f in fiados:
        db.delete(f)

    # Restore inventory
    product = db.query(Product).filter(Product.id == sale.product_id).first()
    if product:
        product.quantity += sale.quantity
        
    db.delete(sale)
    db.commit()
    return {"ok": True}
