import * as z from 'zod';

export const baseEmployeeSchema = z.object({
  full_name: z.string()
    .min(2, 'Full Name is required')
    .regex(/^[^0-9]+$/, 'Full Name cannot contain numbers'),
  email: z.string().trim().toLowerCase().email('Invalid email')
    .refine((val) => val.endsWith('@gmail.com'), {
      message: "Email must be a valid @gmail.com address"
    }),
  mobile_number: z.string()
    .length(10, 'Mobile must be 10 digits')
    .regex(/^[6-9]\d{9}$/, 'Must be a valid phone number starting with 6-9'),
  designation: z.string().min(2, 'Designation is required'),
});

export const createEmployeeSchema = baseEmployeeSchema.extend({
  employee_id: z.string().min(2, 'Employee ID is required'),
  role: z.enum(['employee', 'intern']),
});

export const updateEmployeeSchema = baseEmployeeSchema.extend({
  employee_id: z.string().min(2, 'Employee ID is required'),
  role: z.enum(['employee', 'intern']),
});

export const profileUpdateSchema = baseEmployeeSchema;

export type BaseEmployeeFormValues = z.infer<typeof baseEmployeeSchema>;
export type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeSchema>;
export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;
