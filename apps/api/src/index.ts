import { buildServer } from './server.js';
import { loadEnv } from './config/env.js';

async function main() {
  const env = loadEnv();
  const app = await buildServer();

  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    console.log(`🚀 Servidor de API ejecutándose en http://${env.API_HOST}:${env.API_PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
