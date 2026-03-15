import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Products')

with open('products.json') as json_file:
    data = json.load(json_file)
    for item in data:
        table.put_item(
            Item={
                'id': item['id'],
                'product_name': item['product_name'],
                'description': item['description'],
                'price': item['price'],
                'product_group': item['product_group'],
                'image_url': item['image_url']
            }
        )
