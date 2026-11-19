import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: corsOrigins
      ? corsOrigins.split(',').map((o) => o.trim())
      : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
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

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on http://0.0.0.0:${port}/api/v1`);
  console.log(`📚 Swagger docs on http://0.0.0.0:${port}/api/docs`);

  const expressApp = app.getHttpAdapter().getInstance();
  const altPort = port === 8080 ? 3000 : 8080;
  try {
    const altServer = expressApp.listen(altPort, '0.0.0.0', () => {
      console.log(`🚀 Also listening on http://0.0.0.0:${altPort}`);
    });
    altServer.on('error', (err: any) => {
      console.log(`Note: Secondary port ${altPort} not active: ${err?.message || err}`);
    });
  } catch {
    // Secondary port ignored if not allowed
  }
}

bootstrap();
