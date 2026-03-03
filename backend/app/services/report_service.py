from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.sale import Sale
from app.models.product import Product
from app.models.credit_sale import CreditSale
from datetime import datetime, date

def get_dashboard_summary(db: Session):
    today = date.today()
    current_month = today.month
    current_year = today.year
    
    # Re-calculate with new logic:
    # 1. Total sold today based on Sale total_value + any CreditPayment today (or just Sale is enough if we consider a Fiado as a "Sale" that isn't paid yet, or we only count actual cash flow).
    # Since Fiado is a Sale with a 'FIADO' payment method, the DB `total_value` of the Sale already includes the Fiado amount.
    # To avoid double counting, we just sum Sale.total_value for today.
    # But wait, what if someone pays an OLD Fiado today? That's cash flow. Let's provide both "Sales Revenue" (Vendido) and "Cash Received" (Recebido).
    
    # For now, let's keep it simple: Total Sold (Vendido) is sum of all Sales (including Fiado portions).
    sales_today = db.query(func.sum(Sale.total_value)).filter(
        func.date(Sale.sale_date) == today
    ).scalar() or 0.0
    
    # We ALSO add pure standalone CreditSales made today that don't have a sale_id.
    standalone_credits_today = db.query(func.sum(CreditSale.total_value)).filter(
        func.date(CreditSale.sale_date) == today,
        CreditSale.sale_id == None
    ).scalar() or 0.0
    
    total_today = sales_today + standalone_credits_today
    
    # Total month
    sales_month = db.query(func.sum(Sale.total_value)).filter(
        func.extract('month', Sale.sale_date) == current_month,
        func.extract('year', Sale.sale_date) == current_year
    ).scalar() or 0.0
    
    standalone_credits_month = db.query(func.sum(CreditSale.total_value)).filter(
        func.extract('month', CreditSale.sale_date) == current_month,
        func.extract('year', CreditSale.sale_date) == current_year,
        CreditSale.sale_id == None
    ).scalar() or 0.0
    
    total_month = sales_month + standalone_credits_month
    
    # Profit Month
    sales_month_records = db.query(Sale, Product).join(Product).filter(
        func.extract('month', Sale.sale_date) == current_month,
        func.extract('year', Sale.sale_date) == current_year
    ).all()
    
    credit_month_records = db.query(CreditSale, Product).join(Product).filter(
        func.extract('month', CreditSale.sale_date) == current_month,
        func.extract('year', CreditSale.sale_date) == current_year,
        CreditSale.sale_id == None
    ).all()
    
    profit_month = sum([(s.Sale.total_value - (s.Product.cost_price * s.Sale.quantity)) for s in sales_month_records])
    profit_month += sum([(c.CreditSale.total_value - (c.Product.cost_price * c.CreditSale.quantity)) for c in credit_month_records])
    
    # Items Built logic
    items_sold_month = sum([s.Sale.quantity for s in sales_month_records]) + sum([c.CreditSale.quantity for c in credit_month_records if c.CreditSale.product_id])
    
    top_product = None
    product_sales = {}
    for s in sales_month_records:
        pid = s.Product.id
        product_sales[pid] = product_sales.get(pid, 0) + s.Sale.quantity
    for c in credit_month_records:
        if c.CreditSale.product_id:
            pid = c.Product.id
            product_sales[pid] = product_sales.get(pid, 0) + c.CreditSale.quantity
            
    if product_sales:
        top_product_id = max(product_sales, key=product_sales.get)
        top_product = db.query(Product).filter(Product.id == top_product_id).first().name

    return {
        "total_sold_today": total_today,
        "total_sold_month": total_month,
        "total_items_sold": items_sold_month,
        "profit_month": profit_month,
        "top_product": top_product or "Nenhum",
    }

def get_pending_credits(db: Session):
    return db.query(CreditSale).filter(CreditSale.status.in_(["PENDING", "PARTIAL"])).all()
