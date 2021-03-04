import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { WinstonModule } from 'nest-winston';
import { ConfigModule } from '@nestjs/config';

import LoggerConfig from '../logger.config';
import { UpdateExchangeRateService } from './update-exchange-rate.service';
import { WorkerService } from './worker.service';

const logger: LoggerConfig = new LoggerConfig();

@Module({
  imports: [
    ConfigModule.forRoot({}),
    ConsoleModule,
    WinstonModule.forRoot(logger.console())
  ],
  providers: [UpdateExchangeRateService, WorkerService],
  exports: [UpdateExchangeRateService, WorkerService],
})
export class UpdateExchangeRateModule {}
