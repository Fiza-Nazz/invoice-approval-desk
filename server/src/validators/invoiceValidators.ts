import { z } from 'zod';
import { INVOICE_STATUSES, type InvoiceStatus } from '@invoice-desk/shared';

export const invoiceIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Invoice ID must be a positive integer')
    .transform((val) => parseInt(val, 10)),
});

export const invoiceListQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const parts = val.split(',').map((s) => s.trim().toLowerCase());
      return parts;
    })
    .refine(
      (parts) => {
        if (!parts) return true;
        return parts.every((p) => INVOICE_STATUSES.includes(p as InvoiceStatus));
      },
      {
        message: `Status must be a comma-separated list of valid statuses: ${INVOICE_STATUSES.join(', ')}`,
      }
    ),
});

export const updateStatusBodySchema = z.object({
  status: z.enum(['approved', 'rejected', 'needs_review'], {
    errorMap: () => ({
      message: "Target status must be one of: 'approved', 'rejected', or 'needs_review'",
    }),
  }),
  note: z.string().max(1000).optional(),
});

export type UpdateStatusBody = z.infer<typeof updateStatusBodySchema>;
