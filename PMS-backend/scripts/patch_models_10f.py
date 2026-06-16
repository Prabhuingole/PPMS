import re

timesheet_path = r"e:\sam projects\SPMS\PMS-backend\app\models\timesheet.py"
with open(timesheet_path, "r", encoding="utf-8") as f:
    ts_content = f.read()

ts_content = ts_content.replace(
    'user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)',
    'user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)'
)
ts_content = ts_content.replace(
    'user = relationship("User", backref=backref("timesheets", cascade="all, delete-orphan"))',
    'user = relationship("User", backref="timesheets")'
)

if "billed_currency = Column" not in ts_content:
    ts_content = ts_content.replace(
        'billed_rate = Column(Float, nullable=True)',
        'billed_rate = Column(Float, nullable=True)\n    billed_currency = Column(String(10), nullable=True)'
    )

with open(timesheet_path, "w", encoding="utf-8") as f:
    f.write(ts_content)

doc_path = r"e:\sam projects\SPMS\PMS-backend\app\models\document.py"
with open(doc_path, "r", encoding="utf-8") as f:
    doc_content = f.read()

doc_content = doc_content.replace(
    'uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)',
    'uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)'
)
doc_content = doc_content.replace(
    'uploaded_by = relationship("User", backref=backref("uploaded_documents", cascade="all, delete-orphan"))',
    'uploaded_by = relationship("User", backref="uploaded_documents")'
)

with open(doc_path, "w", encoding="utf-8") as f:
    f.write(doc_content)

print("Models updated!")
