import { Inject } from '@nestjs/common';
import { Console, Command } from 'nestjs-console';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

// import * as chalk from 'chalk';
// import * as cluster from 'cluster';
import { WorkerService } from './worker.service';

@Console()
export class UpdateExchangeRateService {
  constructor(
    private readonly workerService: WorkerService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Command({
    command: 'keep-updated-exchange-rate',
    description:
      'Updates exchange rate',
  })
  async keepUpdatedExchangeRate(): Promise<void> {
      await this.workerService.startUpdateExchangeRate(WorkerService.PROCESS_QUEUE_NO_TIMEOUT)
  }
}
