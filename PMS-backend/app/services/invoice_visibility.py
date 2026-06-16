from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User, UserRole
from app.models.invoice import Invoice

class InvoiceVisibilityService:
    @staticmethod
    def get_visible_query(user: User, db: Session):
        """
        Returns a query containing only invoices visible to the given user.
        Superadmins see all invoices.
        Client Admins see invoices where their company is the client.
        Consultancy Admins see invoices where their company is the vendor.
        """
        query = db.query(Invoice)
        if user.role == UserRole.SUPERADMIN:
            return query
        elif user.role == UserRole.ADMIN:
            if not user.company_id:
                return query.filter(Invoice.id == -1) # Prevent access if no company
            
            # Since an admin can belong to either a vendor or a client company,
            # they should see invoices connected to their company.
            return query.filter(
                (Invoice.vendor_company_id == user.company_id) | 
                (Invoice.client_company_id == user.company_id)
            )
        else:
            # Consultants and interns don't have invoice visibility
            return query.filter(Invoice.id == -1)

    @staticmethod
    def can_view(user: User, invoice: Invoice) -> bool:
        if user.role == UserRole.SUPERADMIN:
            return True
        if user.role == UserRole.ADMIN and user.company_id:
            if invoice.vendor_company_id == user.company_id or invoice.client_company_id == user.company_id:
                return True
        return False

    @staticmethod
    def can_edit(user: User, invoice: Invoice) -> bool:
        # Currently, only superadmins can issue/pay/cancel invoices
        return user.role == UserRole.SUPERADMIN

    @staticmethod
    def can_delete(user: User, invoice: Invoice) -> bool:
        return False
