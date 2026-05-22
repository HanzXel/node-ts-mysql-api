import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../_helpers/db';
import { Role } from '../_helpers/role';
import { sendEmail } from '../_helpers/send-email';

// Use environment variables in production, fallback to config.json locally
let config: any;
try {
  config = require('../config.json');
} catch {
  config = {};
}

const secret = process.env.JWT_SECRET || config.secret || 'SUPER-SECRET-KEY-REPLACE-ME';
// Always use CORS_ORIGIN as the frontend URL for email links
const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:4200';

export const accountService = {
  authenticate,
  refreshToken,
  revokeToken,
  register,
  verifyEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getAll,
  getById,
  create,
  update,
  delete: _delete
};

async function authenticate({ email, password, ipAddress }: any) {
  const account = await db.Account.scope('withHash').findOne({ where: { email } });
  if (!account || !account.isVerified || !bcrypt.compareSync(password, account.passwordHash)) {
    throw 'Email or password is incorrect';
  }
  const jwtToken = generateJwtToken(account);
  const refreshTokenObj = await generateRefreshToken(account, ipAddress);
  await refreshTokenObj.save();
  return { ...basicDetails(account), jwtToken, refreshToken: refreshTokenObj.token };
}

async function refreshToken({ token, ipAddress }: any) {
  const refreshTokenObj = await getRefreshToken(token);
  const account = await refreshTokenObj.getAccount();
  const newRefreshToken = await generateRefreshToken(account, ipAddress);
  refreshTokenObj.revoked = new Date();
  refreshTokenObj.revokedByIp = ipAddress;
  refreshTokenObj.replacedByToken = newRefreshToken.token;
  await refreshTokenObj.save();
  await newRefreshToken.save();
  const jwtToken = generateJwtToken(account);
  return { ...basicDetails(account), jwtToken, refreshToken: newRefreshToken.token };
}

async function revokeToken({ token, ipAddress }: any) {
  const refreshTokenObj = await getRefreshToken(token);
  refreshTokenObj.revoked = new Date();
  refreshTokenObj.revokedByIp = ipAddress;
  await refreshTokenObj.save();
}

async function register(params: any, origin: string) {
  if (await db.Account.findOne({ where: { email: params.email } })) {
    return await sendAlreadyRegisteredEmail(params.email);
  }
  const account = new db.Account(params);
  const isFirstAccount = (await db.Account.count()) === 0;
  account.role = isFirstAccount ? Role.Admin : Role.User;
  account.verificationToken = randomTokenString();
  account.passwordHash = bcrypt.hashSync(params.password, 10);
  await account.save();
  await sendVerificationEmail(account);
}

async function verifyEmail({ token }: any) {
  const account = await db.Account.findOne({ where: { verificationToken: token } });
  if (!account) throw 'Verification failed';
  account.verified = new Date();
  account.verificationToken = undefined;
  await account.save();
}

async function forgotPassword({ email }: any, origin: string) {
  const account = await db.Account.findOne({ where: { email } });
  if (!account) return;
  account.resetToken = randomTokenString();
  account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await account.save();
  await sendPasswordResetEmail(account);
}

async function validateResetToken({ token }: any) {
  const account = await db.Account.findOne({ where: { resetToken: token } });
  if (!account || account.resetTokenExpires < new Date()) throw 'Invalid token';
  return account;
}

async function resetPassword({ token, password }: any) {
  const account = await validateResetToken({ token });
  account.passwordHash = bcrypt.hashSync(password, 10);
  account.passwordReset = new Date();
  account.resetToken = undefined;
  account.resetTokenExpires = undefined;
  await account.save();
}

async function getAll() {
  const accounts = await db.Account.findAll();
  return accounts.map(basicDetails);
}

async function getById(id: number) {
  const account = await getAccount(id);
  return basicDetails(account);
}

async function create(params: any) {
  if (await db.Account.findOne({ where: { email: params.email } })) {
    throw `Email '${params.email}' is already registered`;
  }
  const account = new db.Account(params);
  account.verified = new Date();
  account.passwordHash = bcrypt.hashSync(params.password, 10);
  await account.save();
  return basicDetails(account);
}

async function update(id: number, params: any) {
  const account = await getAccount(id);
  if (params.email && account.email !== params.email &&
      await db.Account.findOne({ where: { email: params.email } })) {
    throw `Email '${params.email}' is already taken`;
  }
  if (params.password) {
    params.passwordHash = bcrypt.hashSync(params.password, 10);
  }
  Object.assign(account, params);
  account.updated = new Date();
  await account.save();
  return basicDetails(account);
}

async function _delete(id: number) {
  const account = await getAccount(id);
  await account.destroy();
}

// ─── Helpers ──────────────────────────────────────────────────────

async function getAccount(id: number) {
  const account = await db.Account.findByPk(id);
  if (!account) throw 'Account not found';
  return account;
}

async function getRefreshToken(token: string) {
  const refreshToken = await db.RefreshToken.findOne({ where: { token } });
  if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
  return refreshToken;
}

function generateJwtToken(account: any) {
  return jwt.sign({ sub: account.id, id: account.id }, secret, { expiresIn: '15m' });
}

async function generateRefreshToken(account: any, ipAddress: string) {
  return new db.RefreshToken({
    accountId: account.id,
    token: randomTokenString(),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ipAddress
  });
}

function randomTokenString() {
  return crypto.randomBytes(40).toString('hex');
}

function basicDetails(account: any) {
  const { id, firstName, lastName, email, role, created, updated, isVerified } = account;
  return { id, firstName, lastName, email, role, created, updated, isVerified };
}

// ─── Email Helpers — always use frontendUrl so links point to Angular app ──

async function sendVerificationEmail(account: any) {
  const verifyUrl = `${frontendUrl}/account/verify-email?token=${account.verificationToken}`;
  await sendEmail({
    to: account.email,
    subject: 'Sign-up Verification - Verify Email',
    html: `<p>Please click the link below to verify your email address:</p>
           <p><a href="${verifyUrl}">${verifyUrl}</a></p>`
  });
}

async function sendAlreadyRegisteredEmail(email: string) {
  await sendEmail({
    to: email,
    subject: 'Email Already Registered',
    html: `<p>Your email <strong>${email}</strong> is already registered.</p>
           <p>If you forgot your password, visit the <a href="${frontendUrl}/account/forgot-password">forgot password</a> page.</p>`
  });
}

async function sendPasswordResetEmail(account: any) {
  const resetUrl = `${frontendUrl}/account/reset-password?token=${account.resetToken}`;
  await sendEmail({
    to: account.email,
    subject: 'Reset Password',
    html: `<p>Please click the link below to reset your password (valid for 24 hours):</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>`
  });
}
