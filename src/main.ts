import * as dotenv from 'dotenv';
dotenv.config();
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UploadController } from './commands/upload.controller';
import { ParseController } from './commands/parse.controller';

@Module({
  imports: [CqrsModule],
  controllers: [UploadController, ParseController],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
  // eslint-disable-next-line no-console
  console.log('Backend API running on http://localhost:3000');
}

bootstrap();
