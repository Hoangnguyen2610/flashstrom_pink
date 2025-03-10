import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly authService: AuthService // Make sure to inject AuthService
  ) {}

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers['authorization'];

    if (!authorization) {
      return false; // No token in the request
    }

    const token = authorization.split(' ')[1]; // Bearer <token>

    if (!token) {
      return false; // No token found after 'Bearer'
    }

    try {
      const payload = this.jwtService.verify(token); // Verify the token
      request.user = payload; // Attach the decoded user data to the request
      return true;
    } catch (error) {
      console.log('error', error);
      return false; // Token verification failed
    }
  }
}
