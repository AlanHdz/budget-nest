import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser())

  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPassword = process.env.SWAGGER_PASSWORD;

  if (!swaggerUser || !swaggerPassword) {
    throw new Error(
      'Las variables de entorno SWAGGER_USER y SWAGGER_PASSWORD son requeridas.',
    );
  }

  app.use(['/api/docs', '/api/docs-json'], basicAuth({
    challenge: true,
    users: {
      [swaggerUser]: swaggerPassword,
    }
  }))

  const config = new DocumentBuilder()
    .setTitle('Budget API')
    .setDescription('The Budget API are the endpoints for consuming the application; it is used to add accounts, income, and expenses organized into categories.')
    .setVersion('0.1')
    .build()

  app.setGlobalPrefix('api/v1')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, 
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  )

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
