import { Router } from 'express';
import type { InvoiceStatus } from '@invoice-desk/shared';
import { InvoicesService } from '../services/invoicesService.js';
import {
  invoiceIdParamSchema,
  invoiceListQuerySchema,
  updateStatusBodySchema,
} from '../validators/invoiceValidators.js';

export function createInvoicesRouter(service?: InvoicesService): Router {
  const router = Router();
  const invoicesService = service || new InvoicesService();

  // GET /api/invoices
  router.get('/invoices', (req, res, next) => {
    try {
      const query = invoiceListQuerySchema.parse(req.query);
      const statuses = query.status as InvoiceStatus[] | undefined;
      const result = invoicesService.getInvoices(statuses);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/invoices/:id
  router.get('/invoices/:id', (req, res, next) => {
    try {
      const { id } = invoiceIdParamSchema.parse(req.params);
      const invoice = invoicesService.getInvoiceById(id);
      res.json({ data: invoice });
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/invoices/:id/status
  router.patch('/invoices/:id/status', (req, res, next) => {
    try {
      const { id } = invoiceIdParamSchema.parse(req.params);
      const body = updateStatusBodySchema.parse(req.body);
      const updated = invoicesService.updateInvoiceStatus(id, body.status, body.note);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
