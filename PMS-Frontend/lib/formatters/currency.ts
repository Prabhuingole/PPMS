/**
 * Formats an amount to standard currency representation.
 * @param amount - the numeric amount to format
 * @param currencyCode - the 3-letter currency code (e.g., 'USD', 'INR', 'EUR')
 * @returns formatted string
 */
export function formatCurrency(amount: number | null | undefined, currencyCode: string = 'USD'): string {
    if (amount === null || amount === undefined) {
      amount = 0;
    }
    
    // Fallback if currencyCode is not provided correctly
    if (!currencyCode) {
      currencyCode = 'USD';
    }
  
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch (e) {
      // Fallback for unsupported currencies
      return `${currencyCode} ${amount.toFixed(2)}`;
    }
  }
