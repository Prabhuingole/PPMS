import time
from fastapi.testclient import TestClient
from sqlalchemy import event
from app.main import app
from app.database.session import engine
from app.routes.timesheets import get_superadmin
from app.models.user import User
from app.core.deps import get_current_user

def mock_superadmin():
    return User(id=1, email='admin@example.com', role='superadmin', full_name='Admin')

app.dependency_overrides[get_superadmin] = mock_superadmin
app.dependency_overrides[get_current_user] = mock_superadmin

client = TestClient(app)

query_count = 0
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    global query_count
    query_count += 1

event.listen(engine, 'before_cursor_execute', before_cursor_execute)

start_time = time.time()
response = client.get("/timesheets/dashboard-stats")
end_time = time.time()

event.remove(engine, 'before_cursor_execute', before_cursor_execute)

print(f"Status code: {response.status_code}")
print(f"AFTER - Queries: {query_count}, Time: {(end_time - start_time) * 1000:.2f} ms")
