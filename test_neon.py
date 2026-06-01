# test_neon.py

from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://neondb_owner:npg_wfJ5IxYN2TkO@ep-fancy-star-aos7a8qt-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print(result.scalar())
    print("Connected successfully")