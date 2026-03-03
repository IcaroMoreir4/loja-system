def test_create_credit_sale(client):
    prod_response = client.post(
        "/api/products/",
        json={"name": "Jaqueta", "quantity": 5, "selling_price": 150.0, "cost_price": 75.0}
    )
    product_id = prod_response.json()["id"]

    credit_response = client.post(
        "/api/credits/",
        json={"customer_name": "João", "product_id": product_id, "quantity": 1}
    )
    assert credit_response.status_code == 200
    credit_data = credit_response.json()
    assert credit_data["status"] == "PENDING"
    assert credit_data["customer_name"] == "João"

    get_prod = client.get(f"/api/products/{product_id}")
    assert get_prod.json()["quantity"] == 4

def test_mark_credit_paid(client):
    prod_response = client.post(
        "/api/products/",
        json={"name": "Cinto", "quantity": 10, "selling_price": 20.0, "cost_price": 10.0}
    )
    product_id = prod_response.json()["id"]

    credit_response = client.post(
        "/api/credits/",
        json={"customer_name": "Maria", "product_id": product_id, "quantity": 2}
    )
    assert credit_response.status_code == 200
    credit_id = credit_response.json()["id"]

    paid_response = client.post(f"/api/credits/{credit_id}/payments", json={"amount": 40.0, "payment_method": "PIX"})
    assert paid_response.status_code == 200
    assert paid_response.json()["status"] == "PAID"
    assert paid_response.json()["paid_amount"] == 40.0
