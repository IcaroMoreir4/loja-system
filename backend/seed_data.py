import requests
import json
import time

API_URL = "http://127.0.0.1:8000/api"

SEED_TAG = "demo_seed_v1"


def _get(path: str):
    res = requests.get(f"{API_URL}{path}")
    res.raise_for_status()
    return res.json()


def _post(path: str, payload: dict):
    res = requests.post(f"{API_URL}{path}", json=payload)
    res.raise_for_status()
    return res.json()


def _already_seeded() -> bool:
    try:
        sales = _get("/sales/")
    except Exception:
        return False

    for s in sales:
        for pm in (s.get("payment_methods") or []):
            if pm.get("seed") == SEED_TAG:
                return True
    return False


def _find_product_by_name_variation(products: list, name: str, variation: str | None):
    for p in products:
        if p.get("name") == name and (p.get("variation") or None) == (variation or None):
            return p
    return None


def _ensure_products(products_to_ensure: list[dict]) -> list[dict]:
    existing = _get("/products/")
    created_or_found: list[dict] = []

    for p in products_to_ensure:
        found = _find_product_by_name_variation(existing, p["name"], p.get("variation"))
        if found:
            created_or_found.append(found)
            continue

        created = _post("/products/", p)
        created_or_found.append(created)
        existing.append(created)

    return created_or_found

if _already_seeded():
    print(f"Seed '{SEED_TAG}' already applied. Skipping.")
    raise SystemExit(0)


# 1) Estoque (produtos com quantidade)
products = [
    {"name": "Camiseta Básica Preta", "variation": "M", "quantity": 50, "selling_price": 59.90, "cost_price": 25.00},
    {"name": "Camiseta Básica Preta", "variation": "G", "quantity": 35, "selling_price": 59.90, "cost_price": 25.00},
    {"name": "Calça Jeans Skinny", "variation": "40", "quantity": 12, "selling_price": 129.90, "cost_price": 60.00},
    {"name": "Calça Jeans Skinny", "variation": "42", "quantity": 15, "selling_price": 129.90, "cost_price": 60.00},
    {"name": "Blusa Tricot Inverno", "variation": "U", "quantity": 8, "selling_price": 89.90, "cost_price": 40.00},
    {"name": "Vestido Floral", "variation": "P", "quantity": 10, "selling_price": 149.90, "cost_price": 75.00},
    {"name": "Vestido Floral", "variation": "M", "quantity": 7, "selling_price": 149.90, "cost_price": 75.00},
    {"name": "Jaqueta Jeans", "variation": "U", "quantity": 6, "selling_price": 199.90, "cost_price": 110.00},
]

print("Ensuring products (estoque)...")
created_products = _ensure_products(products)

by_key: dict[tuple[str, str | None], dict] = {}
for p in created_products:
    by_key[(p["name"], p.get("variation") or None)] = p


# 2) Vendas (histórico)
print("Creating sales history...")

sales_payloads = [
    # Venda 1: PIX
    {
        "product_id": by_key[("Camiseta Básica Preta", "M")]["id"],
        "quantity": 2,
        "payment_methods": [
            {"method": "PIX", "amount": 119.80, "seed": SEED_TAG}
        ],
    },
    # Venda 2: Dinheiro + Cartão
    {
        "product_id": by_key[("Calça Jeans Skinny", "42")]["id"],
        "quantity": 1,
        "payment_methods": [
            {"method": "CASH", "amount": 50.00, "seed": SEED_TAG},
            {"method": "CARD", "amount": 79.90, "seed": SEED_TAG},
        ],
    },
    # Venda 3: FIADO total (gera credit automaticamente)
    {
        "product_id": by_key[("Blusa Tricot Inverno", "U")]["id"],
        "quantity": 1,
        "payment_methods": [
            {"method": "FIADO", "amount": 89.90, "customer_name": "João Silva", "seed": SEED_TAG}
        ],
    },
    # Venda 4: PIX + FIADO (gera credit automaticamente)
    {
        "product_id": by_key[("Camiseta Básica Preta", "G")]["id"],
        "quantity": 1,
        "payment_methods": [
            {"method": "PIX", "amount": 20.00, "seed": SEED_TAG},
            {"method": "FIADO", "amount": 39.90, "customer_name": "Maria Oliveira", "seed": SEED_TAG},
        ],
    },
    # Venda 5: Cartão
    {
        "product_id": by_key[("Vestido Floral", "M")]["id"],
        "quantity": 1,
        "payment_methods": [
            {"method": "CARD", "amount": 149.90, "seed": SEED_TAG}
        ],
    },
    # Venda 6: Dinheiro
    {
        "product_id": by_key[("Jaqueta Jeans", "U")]["id"],
        "quantity": 1,
        "payment_methods": [
            {"method": "CASH", "amount": 199.90, "seed": SEED_TAG}
        ],
    },
]

for payload in sales_payloads:
    _post("/sales/", payload)


# 3) Fiados (standalone) + pagamentos (parcial e quitado)
print("Creating standalone credits (fiados) and payments...")

credit1 = _post(
    "/credits/",
    {
        "customer_name": "Ana Souza",
        "product_id": by_key[("Vestido Floral", "P")]["id"],
        "quantity": 1,
    },
)
_post(f"/credits/{credit1['id']}/payments", {"amount": 50.00, "payment_method": "PIX"})

credit2 = _post(
    "/credits/",
    {
        "customer_name": "Carlos Pereira",
        "total_value": 120.00,
    },
)
_post(f"/credits/{credit2['id']}/payments", {"amount": 120.00, "payment_method": "CASH"})

credit3 = _post(
    "/credits/",
    {
        "customer_name": "Mariana Lima",
        "product_id": by_key[("Calça Jeans Skinny", "40")]["id"],
        "quantity": 1,
    },
)

print("Finished seeding data!")
