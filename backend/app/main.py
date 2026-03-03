from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import products, sales, credits, reports

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Loja System API",
    description="API for the Loula Control store management system.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(sales.router, prefix="/api/sales", tags=["sales"])
app.include_router(credits.router, prefix="/api/credits", tags=["credits"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Loja System API"}
