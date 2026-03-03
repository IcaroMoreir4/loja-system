import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from app.database import engine
from sqlalchemy import text

print("Adding variation column to products table...")
with engine.connect() as con:
    try:
        # Check if exists first to avoid errors if run twice
        result = con.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='products' and column_name='variation';"))
        if result.fetchone() is None:
            con.execute(text("ALTER TABLE products ADD COLUMN variation VARCHAR;"))
            con.commit()
            print("Successfully added variation column.")
        else:
            print("Column 'variation' already exists.")
    except Exception as e:
        print("Error during alter:", e)

print("Done!")
