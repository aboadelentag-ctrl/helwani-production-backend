import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as http from 'http';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.get('/', (req: any, res: any) => {
    res.status(200).json({ status: 'ok', service: 'helwani-production-tracking-api' });
  });

  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: corsOrigins
      ? corsOrigins.split(',').map((o) => o.trim())
      : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Helwani Production Tracking API')
    .setDescription('Production tracking system for Helwani Abu Adel factory')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const primaryPort = process.env.PORT ? Number(process.env.PORT) : 8080;
  await app.listen(primaryPort, '0.0.0.0');
  console.log(`🚀 Main server running on http://0.0.0.0:${primaryPort}/api/v1`);
  console.log(`📚 Swagger docs on http://0.0.0.0:${primaryPort}/api/docs`);

  const secondaryPort = primaryPort === 8080 ? 3000 : 8080;
  try {
    const secondaryServer = http.createServer(expressInstance);
    secondaryServer.on('error', (err: any) => {
      console.log(`Note: Secondary port ${secondaryPort} not active: ${err?.message || err}`);
    });
    secondaryServer.listen(secondaryPort, '0.0.0.0', () => {
      console.log(`🚀 Secondary server running on http://0.0.0.0:${secondaryPort}/api/v1`);
    });
  } catch (e) {}
}

bootstrap();
