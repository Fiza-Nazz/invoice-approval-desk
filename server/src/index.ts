import { createApp } from './app.js';
import { getDb } from './db/connection.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// Ensure DB is initialized
getDb();

const app = createApp();

app.listen(PORT, () => {
  console.log(`Invoice Approval Desk API running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Invoices endpoint: http://localhost:${PORT}/api/invoices`);
});
