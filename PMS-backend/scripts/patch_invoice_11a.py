import re

path = r"e:\sam projects\SPMS\PMS-backend\app\models\invoice.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

new_fields = """    total_amount = Column(Float, nullable=False, default=0.0)
    subtotal = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    issued_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    paid_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)"""

content = content.replace('    total_amount = Column(Float, nullable=False, default=0.0)', new_fields)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("invoice.py patched for 11A!")
