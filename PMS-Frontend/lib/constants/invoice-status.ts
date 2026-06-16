export const INVOICE_STATUS = {
    DRAFT: 'draft',
    ISSUED: 'issued',
    PAID: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled',
  } as const;
  
  export type InvoiceStatusType = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];
  
  export const INVOICE_STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"; colorClass: string }> = {
    [INVOICE_STATUS.DRAFT]: {
      label: 'Draft',
      variant: 'secondary',
      colorClass: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200',
    },
    [INVOICE_STATUS.ISSUED]: {
      label: 'Issued',
      variant: 'outline',
      colorClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
    },
    [INVOICE_STATUS.PAID]: {
      label: 'Paid',
      variant: 'success',
      colorClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    },
    [INVOICE_STATUS.OVERDUE]: {
      label: 'Overdue',
      variant: 'destructive',
      colorClass: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
    },
    [INVOICE_STATUS.CANCELLED]: {
      label: 'Cancelled',
      variant: 'outline',
      colorClass: 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200',
    },
  };
