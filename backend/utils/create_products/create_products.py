import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Products')

with open('products.json', 'r') as f:
    products = json.load(f)

for product in products:
    table.put_item(Item=product)
    print(f"Added: {product['product_name']}")

print(f"\nSuccessfully added {len(products)} products to the Products table.")
