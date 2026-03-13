import requests
import json
import uuid

BASE_URL = "http://localhost:8000/api"

def print_result(name, res):
    print(f"--- {name} ---")
    print(f"Status: {res.status_code}")
    try:
        print(f"Body: {json.dumps(res.json(), indent=2)}")
    except:
        print(f"Text: {res.text}")
    print()

def test_crud():
    print("Testing Products CRUD...")
    # Create Product
    product_data = {
        "name": "Test Product",
        "variation": "M",
        "cost_price": 10.0,
        "selling_price": 20.0,
        "quantity": 50
    }
    res = requests.post(f"{BASE_URL}/products/", json=product_data)
    print_result("Create Product", res)
    if res.status_code != 200: return
    
    product_id = res.json().get("id")
    
    # Read Products
    res = requests.get(f"{BASE_URL}/products/")
    print_result("Get Products", res)
    
    # Update Product
    res = requests.put(f"{BASE_URL}/products/{product_id}", json={"name": "Updated Test Product", "selling_price": 25.0})
    print_result("Update Product", res)
    
    print("Testing Sales CRUD...")
    sale_data = {
        "product_id": product_id,
        "quantity": 2,
        "payment_methods": [{"method": "credit_card", "amount": 50.0}]
    }
    res = requests.post(f"{BASE_URL}/sales/", json=sale_data)
    print_result("Create Sale", res)
    sale_id = None
    if res.status_code == 200:
        sale_id = res.json().get("id")
        
    # Read Sales
    res = requests.get(f"{BASE_URL}/sales/")
    print_result("Get Sales", res)
    
    # Update Sale
    if sale_id:
        res = requests.put(f"{BASE_URL}/sales/{sale_id}", json={"status": "refunded"})
        print_result("Update Sale", res)
    
    print("Testing Credits CRUD...")
    credit_data = {
        "customer_name": "Test Customer",
        "product_id": product_id,
        "quantity": 1,
        "total_value": 100.0,
    }
    res = requests.post(f"{BASE_URL}/credits/", json=credit_data)
    print_result("Create Credit", res)
    credit_id = None
    if res.status_code == 200:
        credit_id = res.json().get("id")
        
    # Read Credits
    res = requests.get(f"{BASE_URL}/credits/")
    print_result("Get Credits", res)
    
    # Update Credit (Add Payment)
    if credit_id:
        res = requests.post(f"{BASE_URL}/credits/{credit_id}/payments", json={"amount": 50.0, "payment_method": "cash"})
        print_result("Add Payment to Credit", res)
        
        # Read Credit again
        res = requests.get(f"{BASE_URL}/credits/{credit_id}")
        print_result("Get Credit after payment", res)
    
    print("Testing Reports...")
    res = requests.get(f"{BASE_URL}/reports/dashboard")
    print_result("Get Dashboard", res)
    
    print("Cleaning up...")
    # Delete Credit
    if credit_id:
        res = requests.delete(f"{BASE_URL}/credits/{credit_id}")
        print_result("Delete Credit", res)
        
    # Delete Sale
    if sale_id:
        res = requests.delete(f"{BASE_URL}/sales/{sale_id}")
        print_result("Delete Sale", res)
        
    # Delete Product
    res = requests.delete(f"{BASE_URL}/products/{product_id}")
    print_result("Delete Product", res)

if __name__ == "__main__":
    test_crud()
