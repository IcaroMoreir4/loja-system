def test_dashboard_summary(client):
    prod_response = client.post(
        "/api/products/",
        json={"name": "Boné", "quantity": 10, "selling_price": 30.0, "cost_price": 10.0}
    )
    product_id = prod_response.json()["id"]

    # Register Sale
    client.post( "/api/sales/", json={"product_id": product_id, "quantity": 2, "payment_methods": [{"method": "CASH", "amount": 60.0}]} )
    
    # Register Credit Sale
    client.post( "/api/credits/", json={"customer_name": "Jose", "product_id": product_id, "quantity": 1} )

    # 3 items sold, total selling price = 90, profit = (30-10)*3 = 60
    dash_response = client.get("/api/reports/dashboard")
    assert dash_response.status_code == 200
    data = dash_response.json()
    assert data["total_sold_today"] == 90.0
    assert data["total_items_sold"] == 3
    assert data["profit_month"] == 60.0
    assert data["top_product"] == "Boné"
