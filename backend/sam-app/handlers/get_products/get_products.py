import boto3
import json
from decimal import Decimal


dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("Products")


def decimal_serializer(value):
    """Convert DynamoDB Decimal values into JSON-compatible numbers."""
    if isinstance(value, Decimal):
        if value % 1 == 0:
            return int(value)
        return float(value)

    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def lambda_handler(event, context):
    response = table.scan()
    items = response.get("Items", [])

    # Continue scanning if DynamoDB paginates the response
    while "LastEvaluatedKey" in response:
        response = table.scan(
            ExclusiveStartKey=response["LastEvaluatedKey"]
        )
        items.extend(response.get("Items", []))

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers":
                "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
                "GET,POST,PUT,DELETE,OPTIONS"
        },
        "body": json.dumps(items, default=decimal_serializer)
    }
