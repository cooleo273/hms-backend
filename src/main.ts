import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Hospital Management System API')
    .setDescription(`
      The Hospital Management System API provides endpoints for managing:
      - Patient records and appointments
      - Doctor schedules and consultations
      - Medical records and prescriptions
      - Laboratory tests and results
      - Pharmacy inventory and dispensing
      - Billing and payments
      - Staff management
      - Department operations
    `)
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('patients', 'Patient management endpoints')
    .addTag('doctors', 'Doctor management endpoints')
    .addTag('appointments', 'Appointment scheduling endpoints')
    .addTag('medical-records', 'Medical records management endpoints')
    .addTag('prescriptions', 'Prescription management endpoints')
    .addTag('lab-tests', 'Laboratory test management endpoints')
    .addTag('pharmacy', 'Pharmacy and inventory management endpoints')
    .addTag('billing', 'Billing and payment endpoints')
    .addTag('staff', 'Staff management endpoints')
    .addTag('departments', 'Department management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        theme: 'monokai',
      },
      tryItOutEnabled: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      displayOperationId: false,
      deepLinking: true,
      showExtensions: true,
      showCommonExtensions: true,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      validatorUrl: null,
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #2c3e50; }
        .swagger-ui .opblock.opblock-get { border-color: #3498db; background: rgba(52, 152, 219, 0.1); }
        .swagger-ui .opblock.opblock-post { border-color: #2ecc71; background: rgba(46, 204, 113, 0.1); }
        .swagger-ui .opblock.opblock-put { border-color: #f1c40f; background: rgba(241, 196, 15, 0.1); }
        .swagger-ui .opblock.opblock-delete { border-color: #e74c3c; background: rgba(231, 76, 60, 0.1); }
        .swagger-ui .opblock.opblock-patch { border-color: #9b59b6; background: rgba(155, 89, 182, 0.1); }
        .swagger-ui .btn.execute { background-color: #2c3e50; }
        .swagger-ui .btn.execute:hover { background-color: #34495e; }
        .swagger-ui .scheme-container { background-color: #f8f9fa; }
        .swagger-ui .servers-title { color: #2c3e50; }
        .swagger-ui .servers { background-color: #f8f9fa; }
        .swagger-ui .servers > label { color: #2c3e50; }
        .swagger-ui .servers select { border-color: #bdc3c7; }
        .swagger-ui .servers select:focus { border-color: #3498db; }
        .swagger-ui .auth-wrapper { background-color: #f8f9fa; }
        .swagger-ui .auth-container { background-color: #f8f9fa; }
        .swagger-ui .auth-container h4 { color: #2c3e50; }
        .swagger-ui .auth-container .wrapper { background-color: #f8f9fa; }
        .swagger-ui .auth-container input { border-color: #bdc3c7; }
        .swagger-ui .auth-container input:focus { border-color: #3498db; }
        .swagger-ui .auth-container .authorize { background-color: #2c3e50; }
        .swagger-ui .auth-container .authorize:hover { background-color: #34495e; }
        .swagger-ui .auth-container .authorize.locked { background-color: #27ae60; }
        .swagger-ui .auth-container .authorize.locked:hover { background-color: #2ecc71; }
        .swagger-ui .auth-container .authorize.unlocked { background-color: #e74c3c; }
        .swagger-ui .auth-container .authorize.unlocked:hover { background-color: #c0392b; }
        .swagger-ui .auth-container .authorize.locked svg { fill: #fff; }
        .swagger-ui .auth-container .authorize.unlocked svg { fill: #fff; }
      `,
    },
    customSiteTitle: 'HMS API Documentation',
    customfavIcon: '/favicon.ico',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
