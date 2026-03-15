import boto3
import json
import sys
from datetime import date

# Create a session object
session = boto3.session.Session()

# Get the current AWS region
aws_region = session.region_name

# Create an S3 client
s3 = boto3.client("s3")

# Get the AWS account ID
sts = boto3.client("sts")
account_id = sts.get_caller_identity()["Account"]

# Get the current date in YYYYMMDD format
today = date.today().strftime("%Y%m%d")

# Set the bucket name
bucket_name = f"images-{account_id}-{today}"

# Create the S3 bucket
if aws_region == "us-east-1":
    bucket_response = s3.create_bucket(
        Bucket=bucket_name,
    )
else:
    bucket_response = s3.create_bucket(
        Bucket=bucket_name,
        CreateBucketConfiguration={"LocationConstraint": aws_region},
    )

print(f"Bucket {bucket_name} created successfully in {aws_region}.")

# Turn off block public access
public_access_block_configuration = {
    "BlockPublicAcls": False,
    "IgnorePublicAcls": False,
    "BlockPublicPolicy": False,
    "RestrictPublicBuckets": False,
}

public_access_block_response = s3.put_public_access_block(
    Bucket=bucket_name, PublicAccessBlockConfiguration=public_access_block_configuration
)

print(f"Block public access turned off for {bucket_name}.")

# Create the bucket policy
bucket_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["s3:GetObject"],
            "Resource": [f"arn:aws:s3:::{bucket_name}/*"],
        }
    ],
}

# Convert the policy from JSON dict to string
bucket_policy = json.dumps(bucket_policy)

# Set the bucket policy
bucket_policy_response = s3.put_bucket_policy(Bucket=bucket_name, Policy=bucket_policy)

print(f"Bucket policy applied to {bucket_name}.")
