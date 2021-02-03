import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  return app;
}

// TODO: 通过注入 NODE_ENV 为 local，来方便本地启动服务，进行开发调试
const isLocal = process.env.NODE_ENV === 'local';
if (isLocal) {
  bootstrap().then(app => {
    app.listen(3000, () => {
      console.log(`Server start on http://localhost:3000`);
    });
  });
}

export { bootstrap };
