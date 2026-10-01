import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Global prefix ──────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── CORS ───────────────────────────────────────────────
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS || '*',
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global validation pipe ─────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Swagger API Docs ───────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('WeatherNow API')
    .setDescription('Backend API for WeatherNow mobile app — search history & analytics')
    .setVersion('1.0')
    .addTag('search-history', 'City search history management')
    .addTag('analytics', 'Weather view analytics')
    .addTag('health', 'Health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`\n🌤️  WeatherNow NestJS Backend running on port ${port}`);
  console.log(`📖  Swagger Docs: http://localhost:${port}/docs`);
  console.log(`📡  API Base:     http://localhost:${port}/api\n`);
}

bootstrap();
