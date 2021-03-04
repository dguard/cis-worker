import { BootstrapConsole } from 'nestjs-console';
import { UpdateExchangeRateModule } from './update-exchange-rate';

process.on('unhandledRejection', (err) => {
  throw err;
});

const bootstrap = new BootstrapConsole({
  module: UpdateExchangeRateModule,
  useDecorators: true,
});
bootstrap.init().then(async (app) => {
  try {
    await app.init();

    await bootstrap.boot();
    // process.exit(0);
  } catch (e) {
    process.exit(1);
  }
});
