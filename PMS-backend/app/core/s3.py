import boto3
from botocore.config import Config
from app.core.config import settings
import io

class R2Storage:
    def __init__(self):
        self.endpoint_url = settings.R2_ENDPOINT
        self.s3 = boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto"
        )
        self.bucket = settings.R2_BUCKET_NAME

    def upload_file(self, file_obj, key, content_type=None):
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
        
        self.s3.upload_fileobj(file_obj, self.bucket, key, ExtraArgs=extra_args)
        return key

    def get_file(self, key):
        response = self.s3.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read(), response.get("ContentType")

    def get_download_url(self, key, filename, expires_in=3600):
        # Generate a presigned URL for download
        return self.s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": self.bucket, 
                "Key": key,
                "ResponseContentDisposition": f"attachment; filename={filename}"
            },
            ExpiresIn=expires_in
        )

storage = R2Storage()
