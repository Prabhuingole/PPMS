import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    conn.execute(text("SET enable_seqscan = OFF;"))
    result = conn.execute(text("EXPLAIN ANALYZE SELECT * FROM timesheets WHERE user_id = 1 AND date = '2026-06-09'"))
    for row in result:
        print(row[0])
