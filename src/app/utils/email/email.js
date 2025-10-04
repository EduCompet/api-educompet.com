import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Read both templates
const otpTemplatePath = path.resolve(process.cwd(), 'src/app/utils/email/emailTemplates/otpTemplate.html');
const forgotPasswordTemplatePath = path.resolve(process.cwd(), 'src/app/utils/email/emailTemplates/forgotPasswordTemplate.html');
const subConfirmationTemplate = fs.readFileSync(path.resolve(process.cwd(), 'src/app/utils/email/emailTemplates/subscriptionConfirmationTemplate.html'), 'utf-8');
const subReminderTemplate = fs.readFileSync(path.resolve(process.cwd(), 'src/app/utils/email/emailTemplates/subscriptionReminderTemplate.html'), 'utf-8');
const subExpiredTemplate = fs.readFileSync(path.resolve(process.cwd(), 'src/app/utils/email/emailTemplates/subscriptionExpiredTemplate.html'), 'utf-8');

const otpTemplate = fs.readFileSync(otpTemplatePath, 'utf-8');
const forgotPasswordTemplate = fs.readFileSync(forgotPasswordTemplatePath, 'utf-8');

// ✅ Use Hostinger SMTP instead of Gmail
const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465, // SSL (465) or STARTTLS (587)
    secure: true, // true for port 465, false for port 587
    auth: {
        user: process.env.EMAIL_USER, // "info@educompet.com" or "no-reply@educompet.com"
        pass: process.env.EMAIL_PASS, // exact mailbox password you set in Hostinger
    },
});

// Send OTP Email
export const sendOtpEmail = async (to, otp) => {
    const mailOptions = {
        from: `"EduCompet" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'EduCompet - Email Verification',
        html: otpTemplate.replace('{{otp}}', otp),
    };
    await transporter.sendMail(mailOptions);
};

// Send Password Reset Email
export const sendPasswordResetEmail = async (to, otp) => {
    const mailOptions = {
        from: `"EduCompet" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'EduCompet - Password Reset',
        html: forgotPasswordTemplate.replace('{{otp}}', otp),
    };
    await transporter.sendMail(mailOptions);
};

export const sendSubscriptionConfirmationEmail = async (to, data) => {
    let html = subConfirmationTemplate.replace('{{userName}}', data.userName)
                                      .replace('{{planName}}', data.planName)
                                      .replace('{{className}}', data.className)
                                      .replace('{{expiryDate}}', data.expiryDate)
                                      .replace('{{orderId}}', data.orderId);
    await transporter.sendMail({
        from: `"EduCompet" <${process.env.EMAIL_USER}>`,
        to,
        subject: '✅ Your EduCompet Subscription is Active!',
        html,
    });
};

// ✅ NEW: Function to send subscription reminder email
export const sendSubscriptionReminderEmail = async (to, data) => {
    let html = subReminderTemplate.replace('{{userName}}', data.userName)
                                    .replace('{{planName}}', data.planName)
                                    .replace('{{daysLeft}}', data.daysLeft)
                                    .replace('{{expiryDate}}', data.expiryDate);
    await transporter.sendMail({
        from: `"EduCompet" <${process.env.EMAIL_USER}>`,
        to,
        subject: '🔔 Your EduCompet Subscription is Expiring Soon',
        html,
    });
};

// ✅ NEW: Function to send subscription expired email
export const sendSubscriptionExpiredEmail = async (to, data) => {
    let html = subExpiredTemplate.replace('{{userName}}', data.userName)
                                   .replace('{{planName}}', data.planName);
    await transporter.sendMail({
        from: `"EduCompet" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'We Miss You! Your EduCompet Subscription Has Expired',
        html,
    });
};