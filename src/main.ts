import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Import the ValidationPipe
import * as dotenv from 'dotenv';
import { HttpExceptionFilter } from './utils/createResponse'; // Your custom exception filter

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add this line for debug logging
  app.useLogger(['debug', 'error', 'log', 'verbose', 'warn']);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders:
      'Content-Type, Accept, Authorization, ngrok-skip-browser-warning, X-Content-Type-Options',
    credentials: true,
  });

  app.use((req, res, next) => {
    // Disable Ngrok interception
    res.setHeader('ngrok-skip-browser-warning', 'true');
    // Force response to be treated as JSON
    res.setHeader('Content-Type', 'application/json');
    // Prevent content type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();

  });

  // Use the ValidationPipe globally with the whitelist option
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically remove properties that do not exist in the DTO
      forbidNonWhitelisted: true, // Throw an error if there are non-whitelisted properties
      transform: true // Automatically transform payloads to the DTO class type
    })
  );

  // Register the custom HttpExceptionFilter globally
  app.useGlobalFilters(new HttpExceptionFilter());

  // Start the server
  await app.listen(process.env.PORT ?? 1310);
  console.log('🚀 Server running on port', process.env.PORT ?? 1310);
}

bootstrap();
