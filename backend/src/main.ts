import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as express from 'express';
import { AppModule } from './app.module';
import { createSwaggerDocument } from './common/swagger-document';
import { SwaggerModule } from '@nestjs/swagger';

// Load SMTP and other settings from backend/.env when present (see .env.example)
const envFile = join(__dirname, '..', '.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

async function bootstrap() {
  // Disable built-in body parser so we can set a custom size limit
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // Allow up to 15 MB JSON bodies (needed for base64-encoded spec files)
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const document = createSwaggerDocument(app);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors();
  app.useStaticAssets(join(__dirname, '..', '..', 'frontend'));

  const port = Number(process.env.PORT || '4000');
  await app.listen(port);
}

bootstrap();
