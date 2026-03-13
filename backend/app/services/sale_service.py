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
        
    # Allow negative inventory as per user request (Overselling)
    # if product.quantity < sale.quantity:
    #     raise HTTPException(status_code=400, detail="Not enough inventory")
        
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

def update_sale(db: Session, sale_id: int, sale_update):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
        
    if sale_update.quantity is not None and sale_update.quantity != sale.quantity:
        product = db.query(Product).filter(Product.id == sale.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
            
        qty_diff = sale_update.quantity - sale.quantity
        
        # update inventory
        product.quantity -= qty_diff
        
        # update sale total
        new_total = product.selling_price * sale_update.quantity
        old_total = sale.total_value
        sale.quantity = sale_update.quantity
        sale.total_value = new_total
        
        # Adjust payment methods amounts proportionally or just dump diff on the first method
        if sale.payment_methods and len(sale.payment_methods) > 0:
            methods = list(sale.payment_methods)
            if old_total > 0:
                ratio = new_total / old_total
                for m in methods:
                    m["amount"] = round(m["amount"] * ratio, 2)
            else:
                methods[0]["amount"] = new_total
            # force SQLAlchemy to detect json mutation
            sale.payment_methods = methods
            
        # Also adjust Fiado if it exists
        fiados = db.query(CreditSale).filter(CreditSale.sale_id == sale.id).all()
        for f in fiados:
            # We find the corresponding FIADO amount in the updated methods
            fiado_method = next((m for m in sale.payment_methods if m.get("method") == "FIADO"), None)
            if fiado_method:
                f.total_value = fiado_method["amount"]

    db.commit()
    db.refresh(sale)
    return sale
