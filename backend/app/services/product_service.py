from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.product import Product
from app.models.sale import Sale
from app.models.credit_sale import CreditSale
from app.schemas.product import ProductCreate, ProductUpdate
from fastapi import HTTPException

# Create
def create_product(db: Session, product: ProductCreate):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# Read
def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Product).offset(skip).limit(limit).all()

def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()

# Update
def update_product(db: Session, product_id: int, product_update: ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

# Delete
def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    has_sales = db.query(Sale.id).filter(Sale.product_id == product_id).first() is not None
    has_credit_sales = db.query(CreditSale.id).filter(CreditSale.product_id == product_id).first() is not None

    if has_credit_sales:
        raise HTTPException(
            status_code=400,
            detail="Erro ao apagar: este item possui venda no fiado vinculada."
        )

    if has_sales:
        raise HTTPException(
            status_code=400,
            detail="Erro ao apagar: este item já foi vendido."
        )

    try:
        db.delete(db_product)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir este produto porque ele possui vendas/fiados vinculados. Limpe o histórico relacionado primeiro."
        )
    return {"ok": True}
