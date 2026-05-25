import nodemailer from 'nodemailer';
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
  COACH_LOGIN_URL
} from '../config/mail.config.js';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

const sendMail = async ({ to, subject, html, text }) => {
  if (!SMTP_USER || !SMTP_PASS) {
    logger.warn('SMTP credentials missing; email not sent', { to, subject });
    return { skipped: true, to, subject };
  }

  const info = await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject,
    html,
    text
  });

  logger.info('Email dispatched', { to, subject, messageId: info.messageId });
  return info;
};

export const sendCoachOnboardingEmail = async ({ email, name, temporaryPassword }) => {
  const loginUrl = COACH_LOGIN_URL;
  const subject = 'Welcome to SAMS — Your Coach Portal Credentials';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a56db;">Sports Academy Management System</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your academy administrator has provisioned your coach account. Use the credentials below to sign in:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Login URL</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;"><a href="${loginUrl}">${loginUrl}</a></td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${email}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Temporary Password</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;"><code>${temporaryPassword}</code></td></tr>
      </table>
      <p>Please change your password after your first login for security.</p>
      <p style="color: #6b7280; font-size: 12px;">This is an automated message from SAMS.</p>
    </div>
  `;

  const text = [
    `Hello ${name},`,
    '',
    'Your coach portal credentials:',
    `Login URL: ${loginUrl}`,
    `Email: ${email}`,
    `Temporary Password: ${temporaryPassword}`,
    '',
    'Please change your password after your first login.'
  ].join('\n');

  return sendMail({ to: email, subject, html, text });
};

export const sendParentAttendanceEmail = async ({
  parentEmail,
  studentName,
  status,
  batchName,
  remarks,
  markedAt
}) => {
  const subject = `Attendance Update — ${studentName}`;
  const timestamp = markedAt.toISOString();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #047857;">Student Attendance Notification</h2>
      <p>Dear Parent/Guardian,</p>
      <p>This is to inform you about your child's attendance record:</p>
      <ul>
        <li><strong>Student:</strong> ${studentName}</li>
        <li><strong>Batch:</strong> ${batchName || 'N/A'}</li>
        <li><strong>Status:</strong> ${status}</li>
        <li><strong>Timestamp:</strong> ${timestamp}</li>
        <li><strong>Remarks:</strong> ${remarks || 'None'}</li>
      </ul>
      <p style="color: #6b7280; font-size: 12px;">Automated notification from your Sports Academy.</p>
    </div>
  `;

  const text = [
    'Dear Parent/Guardian,',
    '',
    `Student: ${studentName}`,
    `Batch: ${batchName || 'N/A'}`,
    `Status: ${status}`,
    `Timestamp: ${timestamp}`,
    `Remarks: ${remarks || 'None'}`
  ].join('\n');

  return sendMail({ to: parentEmail, subject, html, text });
};
