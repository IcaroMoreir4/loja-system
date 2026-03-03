import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from app.database import engine, Base
from app.models.product import Product
from app.models.sale import Sale
from app.models.credit_sale import CreditSale
from app.models.credit_payment import CreditPayment
from sqlalchemy import text

print("Force dropping tables...")
with engine.connect() as con:
    try:
        con.execute(text("DROP TABLE IF EXISTS credit_payments CASCADE;"))
        con.execute(text("DROP TABLE IF EXISTS credit_sales CASCADE;"))
        con.execute(text("DROP TABLE IF EXISTS sales CASCADE;"))
        con.execute(text("DROP TABLE IF EXISTS products CASCADE;"))
        con.commit()
    except Exception as e:
        print("Error during drop:", e)

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
