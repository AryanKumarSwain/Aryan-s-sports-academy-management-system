import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER?.trim() || '';
const SMTP_PASS = process.env.SMTP_PASS?.trim() || '';
const MAIL_FROM = process.env.MAIL_FROM?.trim() || SMTP_USER;

let transporter: nodemailer.Transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      requireTLS: !SMTP_SECURE && SMTP_PORT === 587
    });
  }
  return transporter;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!SMTP_USER || !SMTP_PASS) {
    const err = new Error('SMTP not configured') as Error & { code: string };
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }
  try {
    return await getTransporter().sendMail({ from: MAIL_FROM, ...opts });
  } catch (error) {
    console.error('[SMTP]', error);
    throw error;
  }
}

export async function sendAdminWelcomeEmail(opts: {
  email: string;
  name: string;
  academyName: string;
  password: string;
  loginUrl: string;
}) {
  const { email, name, academyName, password, loginUrl } = opts;
  const subject = 'Welcome to SAMS — Your Academy Admin Credentials';
  const html = `
    <h2>Sports Academy Management System</h2>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Your academy <strong>${academyName}</strong> has been registered.</p>
    <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Password:</strong> <code>${password}</code></p>
    <p>Please change your password after first login.</p>
  `;
  const text = `Hello ${name},\nAcademy: ${academyName}\nLogin: ${loginUrl}\nEmail: ${email}\nPassword: ${password}`;
  return sendMail({ to: email, subject, html, text });
}

export async function sendCoachCredentialsEmail(opts: {
  email: string;
  name: string;
  password: string;
  loginUrl: string;
}) {
  const subject = 'SAMS — Coach Portal Credentials';
  const html = `
    <p>Hello <strong>${opts.name}</strong>,</p>
    <p>Login: <a href="${opts.loginUrl}">${opts.loginUrl}</a></p>
    <p>Email: ${opts.email}</p>
    <p>Temporary password: <code>${opts.password}</code></p>
  `;
  const text = `Login: ${opts.loginUrl}\nEmail: ${opts.email}\nPassword: ${opts.password}`;
  return sendMail({ to: opts.email, subject, html, text });
}
