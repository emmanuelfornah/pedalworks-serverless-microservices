import boto3
from decimal import Decimal

TABLE_NAME = "Products"

products = [
    {
        "id": "1",
        "product_name": "bike pedals",
        "price": Decimal("49.99"),
        "inventory_count": 10,
        "image_url": "pedals.jpeg",
    },
    {
        "id": "2",
        "product_name": "bike seat",
        "price": Decimal("79.99"),
        "inventory_count": 8,
        "image_url": "seat.jpeg",
    },
    {
        "id": "3",
        "product_name": "bike bell",
        "price": Decimal("24.99"),
        "inventory_count": 25,
        "image_url": "bell.jpeg",
    },
]

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

for product in products:
    table.put_item(Item=product)
    print(f"Added: {product['product_name']}")

print("Product seed complete.")
