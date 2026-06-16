import * as z from 'zod';

export const baseEmployeeSchema = z.object({
  full_name: z.string({ required_error: 'This field is required' })
    .min(1, 'This field is required')
    .regex(/^[^0-9]+$/, 'Full Name cannot contain numbers'),
  email: z.string({ required_error: 'This field is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  mobile_number: z.string({ required_error: 'This field is required' })
    .length(10, 'Please enter a valid number')
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid number'),
  designation: z.string({ required_error: 'This field is required' })
    .min(1, 'This field is required'),
});

export const createEmployeeSchema = baseEmployeeSchema.extend({
  employee_id: z.string({ required_error: 'This field is required' }).min(1, 'This field is required'),
  role: z.enum(['employee', 'intern', 'consultant'], { required_error: 'Please select an option' }),
  company_id: z.string().optional(),
});

export const updateEmployeeSchema = baseEmployeeSchema.extend({
  employee_id: z.string({ required_error: 'This field is required' }).min(1, 'This field is required'),
  role: z.enum(['employee', 'intern', 'consultant'], { required_error: 'Please select an option' }),
  company_id: z.string().optional(),
});

export const profileUpdateSchema = baseEmployeeSchema;

export type BaseEmployeeFormValues = z.infer<typeof baseEmployeeSchema>;
export type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeSchema>;
export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;
