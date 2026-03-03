def test_create_sale(client):
    # 1. Create a product first
    prod_response = client.post(
        "/api/products/",
        json={"name": "Bermuda", "quantity": 10, "selling_price": 60.0, "cost_price": 30.0}
    )
    product_id = prod_response.json()["id"]

    # 2. Register a sale
    sale_response = client.post(
        "/api/sales/",
        json={"product_id": product_id, "quantity": 2, "payment_methods": [{"method": "PIX", "amount": 120.0}]}
    )
    assert sale_response.status_code == 200
    sale_data = sale_response.json()
    assert sale_data["quantity"] == 2
    assert sale_data["total_value"] == 120.0

    # 3. Verify inventory update
    get_prod = client.get(f"/api/products/{product_id}")
    assert get_prod.json()["quantity"] == 8

def test_prevent_negative_inventory(client):
    prod_response = client.post(
        "/api/products/",
        json={"name": "Meia", "quantity": 2, "selling_price": 10.0, "cost_price": 5.0}
    )
    product_id = prod_response.json()["id"]

    sale_response = client.post(
        "/api/sales/",
        json={"product_id": product_id, "quantity": 3, "payment_methods": [{"method": "CASH", "amount": 30.0}]}
    )
    assert sale_response.status_code == 400
    assert sale_response.json()["detail"] == "Not enough inventory"
