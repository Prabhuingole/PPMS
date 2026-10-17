import re
import json
import logging
from sqlalchemy import text
from sqlalchemy.orm import Session
from openai import OpenAI
from app.core.config import settings
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Try to initialize Gemini client via OpenAI compatibility layer
try:
    client = OpenAI(
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        api_key=settings.GEMINI_API_KEY,
    )
except Exception as e:
    client = None
    logger.error(f"Failed to initialize OpenAI client for Gemini: {e}")

# Provide enough context for the LLM to write valid SQL queries
DB_SCHEMA = """
Table: document_templates
Columns: id (INTEGER), doc_type (VARCHAR), filename (VARCHAR), file_path (VARCHAR), html_content (TEXT), updated_at (DATETIME)

Table: timesheets
Columns: id (INTEGER), company_id (INTEGER), user_id (INTEGER), project_id (INTEGER), date (DATETIME), hours (FLOAT), task_title (VARCHAR), description (TEXT), task_status (VARCHAR), category (VARCHAR), subcategory (VARCHAR), status (VARCHAR), day (VARCHAR), feedback (TEXT), attachment_path (VARCHAR), attachment_name (VARCHAR), attachments (JSON), attendance (VARCHAR), arrival_time (VARCHAR), half_day_period (VARCHAR), break_hours (INTEGER), break_minutes (INTEGER), created_at (DATETIME), updated_at (DATETIME), is_unassigned_project (BOOLEAN), is_billable (BOOLEAN), billed_rate (FLOAT), billed_currency (VARCHAR(10)), billing_status (VARCHAR), invoice_id (INTEGER)

Table: deliverables
Columns: id (INTEGER), project_id (INTEGER), name (VARCHAR), description (TEXT), status (VARCHAR), is_active (BOOLEAN), target_date (DATETIME), created_at (DATETIME), updated_at (DATETIME)

Table: task_comments
Columns: id (INTEGER), task_id (INTEGER), user_id (INTEGER), comment (TEXT), created_at (DATETIME), updated_at (DATETIME)

Table: users
Columns: id (INTEGER), company_id (INTEGER), employee_id (VARCHAR), email (VARCHAR), hashed_password (VARCHAR), password_updated_at (DATETIME), must_change_password (BOOLEAN), account_status (VARCHAR), last_login_at (DATETIME), reset_token (VARCHAR), full_name (VARCHAR), mobile_number (VARCHAR), role (VARCHAR), designation (VARCHAR), bio (VARCHAR), joining_date (DATETIME), is_mfa_enabled (BOOLEAN), mfa_otp (VARCHAR), mfa_otp_expires_at (DATETIME), last_mfa_verified_at (DATETIME), is_active (BOOLEAN), deactivation_reason (VARCHAR), hourly_rate (FLOAT), currency (VARCHAR), failed_login_attempts (INTEGER), locked_until (DATETIME), updated_at (DATETIME), employment_type (VARCHAR), consultant_type (VARCHAR), weekly_capacity_hours (FLOAT)

Table: note_workspaces
Columns: id (INTEGER), user_id (INTEGER), created_at (DATETIME), updated_at (DATETIME)

Table: invoice_reminder_logs
Columns: id (INTEGER), invoice_id (INTEGER), reminder_type (VARCHAR), sent_at (DATETIME)

Table: resource_allocations
Columns: id (INTEGER), user_id (INTEGER), project_id (INTEGER), allocated_hours_per_week (FLOAT), start_date (DATETIME), end_date (DATETIME), is_active (BOOLEAN), created_at (DATETIME), updated_at (DATETIME)

Table: user_sessions
Columns: id (INTEGER), user_id (INTEGER), session_id (VARCHAR), device_info (VARCHAR), ip_address (VARCHAR), created_at (DATETIME), last_active_at (DATETIME), is_active (BOOLEAN), refresh_token_hash (VARCHAR), refresh_token_expires_at (DATETIME)

Table: attendance
Columns: id (INTEGER), user_id (INTEGER), date (DATE), clock_in_time (DATETIME), clock_in_photo (VARCHAR), clock_out_time (DATETIME), clock_out_photo (VARCHAR), working_hours (FLOAT), status (VARCHAR), latitude (FLOAT), longitude (FLOAT), location_accuracy (FLOAT), is_auto_clock_out (BOOLEAN), created_at (DATETIME), updated_at (DATETIME)

Table: note_checklist_items
Columns: id (INTEGER), page_id (INTEGER), text (VARCHAR), is_completed (BOOLEAN), completed_at (DATETIME), sort_order (INTEGER), created_at (DATETIME), updated_at (DATETIME)

Table: audit_logs
Columns: id (INTEGER), company_id (INTEGER), user_id (INTEGER), user_name (VARCHAR), action (VARCHAR), entity_type (VARCHAR), entity_id (VARCHAR), old_values (JSON), new_values (JSON), timestamp (DATETIME), ip_address (VARCHAR), metadata_info (JSON)

Table: invoices
Columns: id (INTEGER), invoice_number (VARCHAR), vendor_company_id (INTEGER), client_company_id (INTEGER), total_amount (FLOAT), subtotal (FLOAT), tax_amount (FLOAT), created_by_id (INTEGER), issued_by_id (INTEGER), paid_by_id (INTEGER), currency (VARCHAR), status (VARCHAR), billing_period_start (DATETIME), billing_period_end (DATETIME), issued_date (DATETIME), due_date (DATETIME), delivered_at (DATETIME), viewed_at (DATETIME), reminder_count (INTEGER), payment_reference (VARCHAR), payment_method (VARCHAR), payment_received_at (DATETIME), created_at (DATETIME), updated_at (DATETIME)

Table: companies
Columns: id (INTEGER), name (VARCHAR), company_name (VARCHAR), code (VARCHAR), address (TEXT), city (VARCHAR), gst_number (VARCHAR), contact_person (VARCHAR), email (VARCHAR), phone (VARCHAR), status (VARCHAR), company_type (VARCHAR), company_owner (VARCHAR), logo_url (VARCHAR), points_of_contact (JSON), restrict_clockin_to_office_ip (BOOLEAN), office_ip_addresses (JSON), created_at (DATETIME), updated_at (DATETIME)

Table: notifications
Columns: id (INTEGER), user_id (INTEGER), title (VARCHAR(255)), message (VARCHAR(1000)), type (VARCHAR(50)), priority (VARCHAR(50)), category (VARCHAR(50)), action_url (VARCHAR(255)), is_read (BOOLEAN), created_at (DATETIME)

Table: tasks
Columns: id (INTEGER), project_id (INTEGER), deliverable_id (INTEGER), assignee_id (INTEGER), creator_id (INTEGER), title (VARCHAR), description (TEXT), estimated_hours (FLOAT), actual_hours (FLOAT), status (VARCHAR), priority (VARCHAR), is_active (BOOLEAN), due_date (DATETIME), created_at (DATETIME), updated_at (DATETIME)

Table: project_documents
Columns: id (INTEGER), company_id (INTEGER), filename (VARCHAR), file_path (VARCHAR), doc_type (VARCHAR), display_name (VARCHAR), preparation_date (DATETIME), project_id (INTEGER), uploaded_by_id (INTEGER), created_at (DATETIME)

Table: projects
Columns: id (INTEGER), owner_company_id (INTEGER), name (VARCHAR), code (VARCHAR), description (TEXT), client_name (VARCHAR), status (VARCHAR), start_date (DATETIME), end_date (DATETIME), total_hours (FLOAT), reporting_manager_id (INTEGER), client_company_id (INTEGER), created_at (DATETIME), updated_at (DATETIME)

Table: note_pages
Columns: id (INTEGER), workspace_id (INTEGER), project_id (INTEGER), title (VARCHAR), content (TEXT), category (VARCHAR), is_pinned (BOOLEAN), is_archived (BOOLEAN), created_at (DATETIME), updated_at (DATETIME)
"""

def check_input_guardrail(prompt: str) -> tuple[bool, str]:
    """
    Layer 1: Input Guardrail
    We now rely on Layer 2 (SQL Execution) to prevent modifications.
    Bypassing the LLM here prevents false rejections of valid read queries.
    """
    if not client:
        return False, "AI Service is not configured properly (Missing API Key)."
        
    return True, ""

def generate_sql(prompt: str, current_user: BaseModel = None) -> str:
    """
    Main Agent (Part 1): Generates SQL from the prompt.
    """
    user_context = ""
    if current_user:
        user_context = f"The user asking this question is '{current_user.full_name}' (user_id={current_user.id}). If they use words like 'I', 'me', 'my', refer to this user_id."

    system_prompt = f"""You are a PostgreSQL expert. Translate the user's question into a valid PostgreSQL SELECT query.
Schema:
{DB_SCHEMA}

Context: {user_context}

Rules:
1. Return ONLY the raw SQL query.
2. Do not include markdown blocks like ```sql or ```.
3. ONLY use SELECT statements.
4. Use JOINs where necessary (e.g., joining users and attendance to find who clocked in).
5. Use CURRENT_DATE for 'today' and CURRENT_TIMESTAMP for 'now'.
"""
    response = client.chat.completions.create(
        model="gemini-3.5-flash",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0.0
    )
    
    sql = response.choices[0].message.content.strip()
    # Strip markdown if the LLM ignored rule 2
    sql = re.sub(r"^```sql", "", sql, flags=re.IGNORECASE)
    sql = re.sub(r"^```", "", sql)
    sql = re.sub(r"```$", "", sql)
    return sql.strip()

def execute_sql_safely(sql: str, db: Session) -> tuple[bool, str | list]:
    """
    Layer 2: Execution Guardrails
    Ensures LLM does not modify DB data (only SELECTs allowed).
    """
    sql_upper = sql.upper()
    
    # 1. Must start with SELECT (allowing whitespace/CTEs)
    if not sql_upper.lstrip().startswith("SELECT") and not sql_upper.lstrip().startswith("WITH"):
         return False, "Generated SQL is not a SELECT query."
         
    # 2. Block Mutating Keywords
    forbidden_keywords = [
        "INSERT ", "UPDATE ", "DELETE ", "DROP ", "ALTER ", 
        "TRUNCATE ", "EXEC ", "GRANT ", "REVOKE ", "REPLACE ", "MERGE "
    ]
    for keyword in forbidden_keywords:
        if keyword in sql_upper:
            return False, f"Forbidden SQL keyword detected: {keyword.strip()}"
            
    # Strip trailing semicolon before appending LIMIT
    if sql.endswith(";"):
        sql = sql[:-1]
    
    # 3. Append LIMIT to prevent massive data dumps
    if "LIMIT " not in sql_upper:
        sql = sql + " LIMIT 100"
        
    # Execute query inside a read-only transaction implicitly by rolling back
    try:
        result = db.execute(text(sql))
        rows = [dict(row._mapping) for row in result.fetchall()]
        db.rollback() # Ensure absolutely no mutations persist
        return True, rows
    except Exception as e:
        db.rollback()
        return False, f"Database execution error: {str(e)}"

def draft_response(prompt: str, data: list) -> str:
    """
    Main Agent (Part 2): Drafts the final response using the data.
    """
    system_prompt = (
        "You are a helpful assistant for a Project Management System. "
        "Answer the user's question based strictly on the provided JSON data. "
        "Do not mention 'the provided JSON data' or 'the database results' in your response. Just answer the question naturally as if you know the answer. "
        "If the data is empty ([]), it means there are no records matching their query. State that clearly (e.g., 'No one has clocked in today' or 'I couldn't find any results')."
    )
    
    user_content = f"User Question: {prompt}\n\nDatabase Results (JSON):\n{json.dumps(data, default=str)}"
    
    response = client.chat.completions.create(
        model="gemini-3.5-flash",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        temperature=0.3
    )
    return response.choices[0].message.content.strip()

def check_output_guardrail(prompt: str, data: list, draft: str) -> str:
    """
    Layer 3: Output Guardrails
    Prevents hallucination. Ensures AI data matches SQL data.
    """
    system_prompt = (
        "You are a strict data auditor. You must check if the Drafted Response contains ANY factual claims "
        "that are NOT supported by the provided Database Results. "
        "If the draft contains hallucinatory numbers, names, or facts not in the data, rewrite the draft to be strictly safe and accurate. "
        "If the draft is fully supported by the data, output the draft exactly as it is. "
        "Output ONLY the final safe response text."
    )
    
    user_content = f"User Question: {prompt}\n\nDatabase Results: {json.dumps(data, default=str)}\n\nDrafted Response: {draft}"
    
    try:
        response = client.chat.completions.create(
            model="gemini-3.5-flash",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.0
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Guardrail 3 Error: {e}")
        return "I experienced an error verifying the output data. For security, I cannot return the response."

def process_chat(prompt: str, current_user: BaseModel, db: Session) -> dict:
    """
    Orchestrates the 3-Layer Architecture.
    """
    # 1st Layer Guardrail
    is_safe, error_msg = check_input_guardrail(prompt)
    if not is_safe:
        return {"status": "error", "message": error_msg}
        
    # Main Agent - Gen SQL
    try:
        sql = generate_sql(prompt, current_user)
    except Exception as e:
        logger.error(f"SQL Generation error: {str(e)}")
        return {"status": "error", "message": f"Failed to generate SQL query: {str(e)}"}
        
    # 2nd Layer Guardrail (Execution)
    is_valid, db_result = execute_sql_safely(sql, db)
    if not is_valid:
        # Pass error back to user (or we could pass to Agent to retry, but failing fast is safer)
        return {"status": "error", "message": f"Query rejected or failed: {db_result}"}
        
    # Main Agent - Draft Response
    try:
        draft = draft_response(prompt, db_result)
    except Exception as e:
         logger.error(f"Draft Response error: {e}")
         return {"status": "error", "message": "Failed to draft a response from data."}
         
    # 3rd Layer Guardrail (Output)
    final_response = check_output_guardrail(prompt, db_result, draft)
    
    return {
        "status": "success", 
        "data": {
            "query_executed": sql,
            "row_count": len(db_result),
            "response": final_response
        }
    }
