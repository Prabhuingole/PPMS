from app.models.invoice import Invoice
from decimal import Decimal, ROUND_HALF_UP

class FinancialValidationService:
    @staticmethod
    def validate_invoice_totals(invoice: Invoice):
        """
        Validates that the invoice subtotal exactly matches the sum of the timesheets 
        (hours * rate) using Decimal arithmetic to prevent floating point inaccuracies.
        Throws a ValueError if a mismatch occurs.
        """
        if not invoice.timesheets:
            if Decimal(str(invoice.subtotal)) != Decimal('0.00'):
                raise ValueError("Invoice has no timesheets but subtotal is not 0")
            return True

        calculated_subtotal = Decimal('0.00')

        for ts in invoice.timesheets:
            # We enforce exactly 2 decimal places for financial calculations
            hours = Decimal(str(ts.hours))
            rate = Decimal(str(ts.billed_rate or 0))
            
            # Calculate row amount
            row_amount = hours * rate
            calculated_subtotal += row_amount

        # Round to 2 decimal places as stored in DB
        calculated_subtotal = calculated_subtotal.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        stored_subtotal = Decimal(str(invoice.subtotal)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        if calculated_subtotal != stored_subtotal:
            raise ValueError(f"Financial inconsistency detected. Calculated subtotal {calculated_subtotal} does not match stored subtotal {stored_subtotal}")
        
        return True
