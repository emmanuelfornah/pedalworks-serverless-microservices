import boto3
from decimal import Decimal

TABLE_NAME = "Products"

# NOTE: image_url has NO "images/" prefix. The frontend combines it with the
# image base (S3 bucket URL, or the local /images fallback) as
# `${IMAGE_BASE_URL}/${product.image_url}`, so a bare filename is required.
products = [
    {"id": "1", "product_name": "cassette", "description": "sprockets, gear wheels", "price": Decimal("50.00"), "inventory_count": 12, "image_url": "cassette.jpeg"},
    {"id": "2", "product_name": "crankset", "description": "Made of Forged Alloy 6061", "price": Decimal("215.00"), "inventory_count": 6, "image_url": "crank-arm.jpeg"},
    {"id": "3", "product_name": "chain", "description": "1/2 x 11/128 Inch 116 Links", "price": Decimal("35.00"), "inventory_count": 30, "image_url": "chain.jpeg"},
    {"id": "4", "product_name": "bell", "description": "pretty loud", "price": Decimal("18.00"), "inventory_count": 40, "image_url": "bell.jpeg"},
    {"id": "5", "product_name": "gear shifter", "description": "very precise", "price": Decimal("32.00"), "inventory_count": 15, "image_url": "gear-shifter.jpeg"},
    {"id": "6", "product_name": "inner tube", "description": "fix any flat tire", "price": Decimal("14.00"), "inventory_count": 50, "image_url": "inner-tube.jpeg"},
    {"id": "7", "product_name": "saddle", "description": "better with than without", "price": Decimal("55.00"), "inventory_count": 20, "image_url": "seat.jpeg"},
    {"id": "8", "product_name": "wheel", "description": "an extra does not hurt", "price": Decimal("179.00"), "inventory_count": 10, "image_url": "wheel.jpeg"},
    {"id": "9", "product_name": "pedals", "description": "you really need them", "price": Decimal("79.00"), "inventory_count": 18, "image_url": "pedals.jpeg"},
    {"id": "10", "product_name": "brake disk", "description": "no more noise on a wet day", "price": Decimal("45.00"), "inventory_count": 22, "image_url": "brake-disk.jpeg"},
    {"id": "11", "product_name": "hydraulic brake", "description": "stop quickly when necessary", "price": Decimal("69.00"), "inventory_count": 14, "image_url": "hydraulic-brake.jpeg"},
    {"id": "12", "product_name": "sports glasses", "description": "wanna look cool?", "price": Decimal("129.00"), "inventory_count": 25, "image_url": "sports-glasses.jpeg"},
]

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

for product in products:
    table.put_item(Item=product)
    print(f"Added: {product['product_name']}")

print(f"\nProduct seed complete. Added {len(products)} products.")
