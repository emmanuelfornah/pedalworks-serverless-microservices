import boto3
import json

# Create a DynamoDB resource
dynamodb = boto3.resource('dynamodb')

# Connect to the DynamoDB table named 'Orders'
table = dynamodb.Table('Orders')

## Add all of the items from a json file named 'orders.json' to the 'Orders' table
with open("orders.json") as json_file:
    orders = json.load(json_file)
    for order in orders:
        table.put_item(
            Item=order
        )