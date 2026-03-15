import boto3
import json
from decimal import Decimal

# This function uses JSON.dumps to ensure proper object serialization
def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    # Use CodeWhisper to complete this handler function
    # Create a DynamoDB resource
    dynamodb = boto3.resource('dynamodb')
    # Connect to the DynamoDB table named 'Orders'
    table = dynamodb.Table('Orders')

    # Add a try block to attempt to retrieve items from the order history table
    try:
        # Scan the table to get all items
        response = table.scan()

        # Store all the 'items' from the response in a variable
        items = response['Items']

        # Create a response body that has the key message with "Successfully got order history" and the key orderHistory for the items
        responseBody = {
            'message': 'Successfully got order history',
            'orders': items
        }

        # Create a response with the 200 statuscode, the responseBody and decimaldefault function and CORS headers
        response = {
            'statusCode': 200,
            'body': json.dumps(responseBody, default=decimal_default),
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            }
        }
    # Add an exception block that creates a response with a 500 status code, the error message 'Error fetching order history' and CORS headers
    except Exception as e:
        response = {
            'statusCode': 500,
            'body': json.dumps({'message': 'Error fetching order history', 'error': str(e)}),
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            }
        }

    # return the response
    return response
