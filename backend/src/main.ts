import { NestFactory } from '@nestjs/core';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsPath = join(process.cwd(), 'uploads');

  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }

  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
