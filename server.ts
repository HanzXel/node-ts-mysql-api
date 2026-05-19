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
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true
}));

// ─── Swagger Docs ──────────────────────────────────────────────────
swaggerDocs(app);

// ─── Routes ───────────────────────────────────────────────────────
app.use('/accounts', accountsController);

// ─── Global Error Handler ──────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Database initialized`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📄 Swagger docs at /api-docs`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
});
