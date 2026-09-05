import boto3
from decimal import Decimal

TABLE_NAME = "Products"

products = [
    {
        "id": "1",
        "product_name": "mountain bike",
        "price": Decimal("899.99"),
        "inventory_count": 10,
        "image_url": "mountain-bike.jpg",
    },
    {
        "id": "2",
        "product_name": "road bike",
        "price": Decimal("749.99"),
        "inventory_count": 8,
        "image_url": "road-bike.jpg",
    },
    {
        "id": "3",
        "product_name": "bike helmet",
        "price": Decimal("59.99"),
        "inventory_count": 25,
        "image_url": "bike-helmet.jpg",
    },
]

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

for product in products:
    table.put_item(Item=product)
    print(f"Added: {product['product_name']}")

print("Product seed complete.")
