import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { createInvoicesRouter } from './routes/invoices.js';
import { errorHandler } from './middleware/errorHandler.js';
import type { InvoicesService } from './services/invoicesService.js';

export function createApp(service?: InvoicesService): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Mount API endpoints under /api
  app.use('/api', healthRouter);
  app.use('/api', createInvoicesRouter(service));

  // Catch unknown routes
  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
