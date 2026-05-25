export const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
export const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
export const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER || 'noreply@sams.local';
export const APP_URL = process.env.APP_URL || 'http://localhost:5000';
export const COACH_LOGIN_URL = process.env.COACH_LOGIN_URL || `${APP_URL}/coach-login.html`;
