import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { errorHandler } from './_middleware/error-handler';
import { swaggerDocs } from './_helpers/swagger';
import accountsController from './accounts/accounts.controller';
import { initialize } from './_helpers/db';

const app = express();

// ─── Middleware ────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({ origin: '*', credentials: true }));

// ─── Swagger Docs ──────────────────────────────────────────────────
swaggerDocs(app);

// ─── Routes ───────────────────────────────────────────────────────
app.use('/accounts', accountsController);

// ─── Global Error Handler ──────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────
const PORT = 4000;

initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Database initialized`);
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📄 Swagger docs at http://localhost:${PORT}/api-docs`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
});