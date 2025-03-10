import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { UsersService } from '../users/users.service';
import { createResponse } from 'src/utils/createResponse';

@Injectable()
export class EmailService {
  constructor(
    @Inject('MAIL_TRANSPORT')
    private readonly transport: nodemailer.Transporter,
    private readonly userService: UsersService
  ) {}

  // Generate a random 6-digit verification code
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendVerificationEmail(to: string) {
    const verificationCode = this.generateVerificationCode();

    // Beautiful HTML email template with verification code
    const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f7f7; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
        h1 { color: #333; text-align: center; }
        .content { font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px; }
        .verification-code { display: inline-block; background-color: #007bff; color: #ffffff; font-size: 36px; padding: 10px 20px; border-radius: 8px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; font-size: 14px; color: #777; }
        a { color: #007bff; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to Our Service!</h1>
        <div class="content">
          <p>Thank you for signing up. To complete your account creation, please verify your email by entering the code below:</p>
          <p class="verification-code">${verificationCode}</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing our service!</p>
          <p><a href="mailto:support@ourservice.com">Contact Support</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

    try {
      // Sending email with the verification code inserted into the template
      await this.transport.sendMail({
        to, // Recipient's email address
        subject: 'Email Verification Code',
        html: emailTemplate // HTML content with injected verification code
      });
      return verificationCode; // Return the code so it can be saved in the user record
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  }

  // You can also keep the sendEmail method as is for general email sending
  async sendEmail(to: string, subject: string, text: string, html?: string) {
    try {
      await this.transport.sendMail({
        to, // Recipient's email address
        subject, // Email subject
        text, // Plain text content
        html // HTML content (optional)
      });
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.userService.findByCondition({ email });

    if (user && user.data.verification_code === +code) {
      await this.userService.update(user.data.id, {
        is_verified: true
      });
      return createResponse('OK', null, 'Email verified successfully');
    }
    return { message: 'Invalid verification code' };
  }
}
