import { Request, Response, NextFunction } from 'express';
import { expressjwt } from 'express-jwt';
import { db } from '../_helpers/db';

// Use environment variables in production, fallback to config.json locally
let config: any;
try {
  config = require('../config.json');
} catch {
  config = {};
}

const secret = process.env.JWT_SECRET || config.secret || 'SUPER-SECRET-KEY-REPLACE-ME';

export function authorize(roles: string[] | string = []) {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return [
    // Step 1: Authenticate JWT token
    expressjwt({ secret, algorithms: ['HS256'] }),

    // Step 2: Authorize role & attach user info
    async (req: any, res: Response, next: NextFunction) => {
      const account = await db.Account.findByPk(req.auth.id);

      if (!account || (roles.length && !roles.includes(account.role))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      req.user = req.auth;
      req.user.role = account.role;
      req.user.ownsToken = (token: string) =>
        !!account.refreshTokens?.find((x: any) => x.token === token);

      next();
    }
  ];
}
