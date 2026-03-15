import boto3
import json
from decimal import Decimal

# This function will be used with JSON.dumps to ensure objects are serialized properly
def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    # Create a DynamoDB resource
    dynamodb = boto3.resource('dynamodb')
    # Connect to the DynamoDB table named 'Orders'
    ordersTable = dynamodb.Table('Orders')
    
    #Extract the order_id from the path parameters
    order_id = event['pathParameters']['order_id']

    #Get one item from ordersTable with the id equal to order_id
    ordersResponse = ordersTable.get_item(
        Key={
            'id': order_id
        }
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            "order": ordersResponse['Item'],
            "message": "successfully got order details for order number: " + order_id
        }, default=decimal_default),
        'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            }
    }
