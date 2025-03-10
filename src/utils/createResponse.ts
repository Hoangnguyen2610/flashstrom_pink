import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter
} from '@nestjs/common';
import { ResponseStatus } from './constants';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

export type ResponseStatusType = keyof typeof ResponseStatus;

export interface ApiResponse<T> {
  EC: number;
  EM: string;
  data: T | null;
}

export function createResponse<T>(
  status: ResponseStatusType,
  data: T | null,
  message?: string
): ApiResponse<T> {
  const statusInfo = ResponseStatus[status];
  const response: ApiResponse<T> = {
    EC: statusInfo.code,
    EM: message || statusInfo.message,
    data
  };

  // Remove the exception throwing logic and just return the response
  return response;
}

@Catch(BadRequestException) // Catch BadRequestException for validation errors
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse() as { message: string };

    // Handle if errorResponse is a string
    if (typeof errorResponse === 'string') {
      return response.status(status).json({
        EC: 2,
        EM: 'InvalidFormatInput',
        data: errorResponse // Send the string as the response
      });
    }

    // Handle if errorResponse is an object with a message property
    if (
      errorResponse &&
      typeof errorResponse === 'object' &&
      'message' in errorResponse
    ) {
      return response.status(status).json({
        EC: 2,
        EM: 'InvalidFormatInput',
        data: errorResponse.message // Access the message from the object
      });
    }

    // Handle validation errors by mapping over them
    if (Array.isArray(errorResponse.message)) {
      const formattedErrors = errorResponse.message.map(
        (error: ValidationError) => {
          return {
            field: error.property,
            constraints: error.constraints
          };
        }
      );

      return response.status(status).json({
        EC: -6,
        EM: 'Controller error',
        data: formattedErrors // Send the formatted validation errors
      });
    }

    // Fallback if the error is not a validation error
    return response.status(status).json({
      EC: -6,
      EM: 'Controller error',
      data: 'An unknown error occurred'
    });
  }
}
