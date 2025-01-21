import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailService } from 'src/mailer/email.service';
import { UserService } from 'src/user/user.service';
import { createResponse } from 'src/utils/createResponse';
import { Enum_UserType } from 'src/types/Payload';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
  ) {}

  @Post('register-customer')
  async registerCustomer(
    @Body()
    userData: {
      phone: string;
      email: string;
      password: string;
      first_name: string;
      last_name: string;
    },
  ) {
    // Step 1: Register the customer with the provided data
    const registrationResponse =
      await this.authService.register(userData, Enum_UserType.CUSTOMER);

    // If registration is successful
    if (registrationResponse?.data?.data) {
      const code = await this.emailService.sendVerificationEmail(
        userData.email,
      ); // Send email to the user's email
      await this.userService.updateUser(
        registrationResponse.data.data.user_id,
        { verification_code: code },
      );

      return createResponse(
        'OK',
        null,
        'Registration successful, verification email sent',
      );
    } else {
      return createResponse(
        'ServerError',
        null,
        'Something went wrong in the server',
      );
    }
  }
  @Post('register-driver')
  async registerDriver(
    @Body()
    userData: {
      phone: string;
      email: string;
      password: string;
      first_name: string;
      last_name: string;
    },
  ) {
    // Step 1: Register the customer with the provided data
    const registrationResponse =
      await this.authService.register(userData, Enum_UserType.DRIVER);

    // If registration is successful
    if (registrationResponse?.data?.data) {
      const code = await this.emailService.sendVerificationEmail(
        userData.email,
      ); // Send email to the user's email
      await this.userService.updateUser(
        registrationResponse.data.data.user_id,
        { verification_code: code },
      );

      return createResponse(
        'OK',
        null,
        'Registration successful, verification email sent',
      );
    } else {
      return createResponse(
        'ServerError',
        null,
        'Something went wrong in the server',
      );
    }
  }

  @Post('login-customer')
  async loginCustomer(@Body() credentials: { email: string; password: string }) {
    return this.authService.login(credentials, Enum_UserType.CUSTOMER);
  }
  @Post('login-driver')
  async loginDriver(@Body() credentials: { email: string; password: string }) {
    return this.authService.login(credentials, Enum_UserType.DRIVER);
  }

  @Post('verify-email')
  async verifyEmail(
    @Body() { email, code }: { email: string; code: string }, // Accept email and verification code
  ) {
    try {
      if (!email || !code) {
        return createResponse(
          'InvalidFormatInput',
          null,
          'You must provide a valid email and a verification code',
        );
      }
      const result = await this.emailService.verifyEmail(email, code); // Verify email with the code
      return result;
    } catch (error) {
      console.error('Error during email verification:', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred during verification, please try again.',
      );
    }
  }
}
