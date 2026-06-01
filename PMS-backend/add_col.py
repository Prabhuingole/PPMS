import sqlite3

conn = sqlite3.connect('pms.db')
cursor = conn.cursor()

try:
    cursor.execute('ALTER TABLE note_pages ADD COLUMN project_id INTEGER;')
    print("Added project_id successfully.")
except Exception as e:
    print(f"Error: {e}")

conn.commit()
conn.close()
