import boto3
import json
import uuid
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("Orders")

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
}


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body),
    }


def _to_decimal(value, default="0"):
    """Safely convert a value to Decimal, falling back to a default."""
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal(default)


def lambda_handler(event, context):
    # Parse the request body (API Gateway delivers it as a JSON string)
    raw_body = event.get("body") if isinstance(event, dict) else None
    if raw_body is None:
        # Support direct invocation with an already-parsed payload
        raw_body = event

    try:
        payload = raw_body if isinstance(raw_body, dict) else json.loads(raw_body)
    except (json.JSONDecodeError, TypeError):
        return _response(400, {"message": "Invalid JSON body"})

    # The frontend sends a map of { product_name: { id, quantity, price } }.
    order_items = []
    total_amount = Decimal("0")

    for product_name, info in payload.items():
        if not isinstance(info, dict):
            continue
        quantity = int(info.get("quantity", 0) or 0)
        if quantity <= 0:
            continue

        price = _to_decimal(info.get("price", "0"))
        line_amount = price * quantity
        total_amount += line_amount

        order_items.append({
            "product_name": product_name,
            "product_id": str(info.get("id", "")),
            "quantity": str(quantity),
            "amount": str(line_amount),
        })

    if not order_items:
        return _response(400, {"message": "Order must contain at least one item"})

    order_id = str(uuid.uuid4())
    order = {
        "id": order_id,
        "total_amount": str(total_amount),
        "order_date_time": datetime.now(timezone.utc).isoformat(),
        "order_items": order_items,
    }

    table.put_item(Item=order)

    return _response(201, {
        "message": "Order created",
        "order_id": order_id,
        "total_amount": str(total_amount),
        "item_count": len(order_items),
    })
