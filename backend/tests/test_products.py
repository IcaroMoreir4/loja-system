def test_create_product(client):
    response = client.post(
        "/api/products/",
        json={"name": "Camiseta", "quantity": 10, "selling_price": 50.0, "cost_price": 25.0}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Camiseta"
    assert data["quantity"] == 10
    assert "id" in data

def test_read_products(client):
    client.post( "/api/products/", json={"name": "Calça", "quantity": 5, "selling_price": 100.0, "cost_price": 50.0} )
    response = client.get("/api/products/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Calça"
