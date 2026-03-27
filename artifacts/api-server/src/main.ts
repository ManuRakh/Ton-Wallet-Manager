import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = process.env.PORT;
  if (!port) {
    throw new Error('PORT environment variable is required');
  }

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });

  await app.listen(Number(port));
  console.log(`NestJS server running on port ${port}`);
}

bootstrap();
