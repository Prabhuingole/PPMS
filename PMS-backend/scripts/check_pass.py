import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.core.security import verify_password

hash = "$2b$12$K0M2kXFQOksHEi3lSGlw8.ELdFUtnkMNPhaIY4Q2tU84OvnmI6qXm"
print("Testing admin@sam:", verify_password("admin@sam", hash))
print("Testing admin@sambhav.com:", verify_password("admin@sambhav.com", hash))
