import boto3
from botocore.config import Config
from app.core.config import settings
import io

class R2Storage:
    def __init__(self):
        self.endpoint_url = settings.R2_ENDPOINT
        self.bucket = settings.R2_BUCKET_NAME
        self._s3_client = None

    @property
    def s3(self):
        # Lazy initialization prevents boto3 from crashing the app during global import phase
        if self._s3_client is None:
            if not self.endpoint_url:
                raise ValueError("R2_ENDPOINT is missing from environment variables")
            self._s3_client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4"),
                region_name="auto"
            )
        return self._s3_client

    def upload_file(self, file_obj, key, content_type=None):
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
        
        self.s3.upload_fileobj(file_obj, self.bucket, key, ExtraArgs=extra_args)
        return key

    def delete_file(self, key):
        self.s3.delete_object(Bucket=self.bucket, Key=key)

    def get_file(self, key):
        response = self.s3.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read(), response.get("ContentType")

    def get_download_url(self, key, filename, expires_in=3600, inline: bool = False):
        # Generate a presigned URL for download
        disposition = f"inline; filename=\"{filename}\"" if inline else f"attachment; filename=\"{filename}\""
        
        params = {
            "Bucket": self.bucket, 
            "Key": key,
            "ResponseContentDisposition": disposition
        }
        
        # Force browser to display certain files inline by setting ResponseContentType
        if inline:
            ext = filename.lower().split('.')[-1] if '.' in filename else ''
            if ext == 'csv' or ext == 'txt':
                params["ResponseContentType"] = "text/plain"
            elif ext == 'pdf':
                params["ResponseContentType"] = "application/pdf"
            elif ext in ['jpg', 'jpeg']:
                params["ResponseContentType"] = "image/jpeg"
            elif ext == 'png':
                params["ResponseContentType"] = "image/png"
            elif ext == 'json':
                params["ResponseContentType"] = "application/json"
            
        return self.s3.generate_presigned_url(
            "get_object",
            Params=params,
            ExpiresIn=expires_in
        )

storage = R2Storage()
