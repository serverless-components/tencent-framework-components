import { join } from 'path';
import { spawnSync } from 'child_process';

const rootDir = join(__dirname, '..');

async function installDependencies(dir: string) {
  spawnSync('yarn', ['install'], {
    cwd: dir,
  });
}

async function installShimDeps() {
  const needInstallFrameworks = ['express', 'koa', 'egg', 'nextjs', 'nuxtjs', 'nestjs'];
  const shimPath = join(rootDir, `src/_shims/`);
  for (let i = 0; i < needInstallFrameworks.length; i++) {
    const current = needInstallFrameworks[i];
    console.log(`[${current}] Install dependencies`);
    await installDependencies(join(shimPath, current));
  }
}

/* eslint-disable no-console*/
async function bootstrap() {
  console.log('[root] Install dependencies');
  await installDependencies(rootDir);

  console.log('[src] Install dependencies');
  await installDependencies(join(rootDir, 'src'));

  await installShimDeps();
}

bootstrap();

process.on('unhandledRejection', (e) => {
  throw e;
});
