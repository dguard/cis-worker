import { Logger } from 'winston';

import * as chalk from 'chalk';
import { Inject, Injectable } from '@nestjs/common';
import * as https from "https";
import moment = require('moment');
import * as fs from 'fs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

const UPDATE_EXCHANGE_RATE_PERIOD_EVERY_5_MINUTES = 'every 5 minutes';
const UPDATE_EXCHANGE_RATE_PERIOD_EVERY_15_MINUTES = 'every 15 minutes';


@Injectable()
export class WorkerService {

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
  }


  protected static EXCHANGE_RATE_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';

  async retrieveExchangeRateList() {
    return new Promise((resolve, reject) => {
      https.get(WorkerService.EXCHANGE_RATE_URL, (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          resolve(JSON.parse(data));
        });

      }).on("error", (err) => {
        reject(err.message);
      });
    }).then((data) => {
      const listExchangeRate = [];

      Object.keys(data['Valute']).map((key) => {
        listExchangeRate.push({
          id: data['Valute'][key]['ID'],
          name: data['Valute'][key]['Name'],
          value: data['Valute'][key]['Value']
        });
      });

      return Promise.resolve(listExchangeRate);
    });
  }

  protected static UPDATE_EXCHANGE_RATE_PERIOD_STARTS_AT_IN_MOSCOW_TIMEZONE = '09:00';
  protected static UPDATE_EXCHANGE_RATE_PERIOD_ENDS_AT_IN_MOSCOW_TIMEZONE = '24:00';

  protected update_exchange_rate_period = UPDATE_EXCHANGE_RATE_PERIOD_EVERY_5_MINUTES;
  protected last_updated_at;

  protected listExchangeRate = [];


  private getCurrentUpdatePeriod (time) {
    if(this.update_exchange_rate_period === UPDATE_EXCHANGE_RATE_PERIOD_EVERY_5_MINUTES) {
      // keep
    } else {
      throw new Error('update exchange rate period is not supported');
    }

    const startTimeInNumber = Number(time);
    const startTime = moment(startTimeInNumber)
      .format('YYYY-MM-DD HH:mm:ss')
      .trim();

    const startTimeHours = Number(startTime.split(' ')[1].split(':')[0]);
    let startTimeMinutes = Number(startTime.split(' ')[1].split(':')[1]);
    let endTimeMinutes;

    const addLeadZero = (number) => {
      if(number < 10) {
        return '0' + number;
      }
      return number;
    };

    if(startTimeMinutes >= 0 && startTimeMinutes < 5) {
      startTimeMinutes = 0;
      endTimeMinutes = 5;
    } else if (startTimeMinutes >= 5 && startTimeMinutes < 10) {
      startTimeMinutes = 5;
      endTimeMinutes = 10;
    } else if (startTimeMinutes >= 10 && startTimeMinutes < 15) {
      startTimeMinutes = 10;
      endTimeMinutes = 15;
    } else if (startTimeMinutes >= 15 && startTimeMinutes < 20) {
      startTimeMinutes = 15;
      endTimeMinutes = 20;
    } else if (startTimeMinutes >= 20 && startTimeMinutes < 25) {
      startTimeMinutes = 20;
      endTimeMinutes = 25;
    } else if (startTimeMinutes >= 25 && startTimeMinutes < 30) {
      startTimeMinutes = 25;
      endTimeMinutes = 30;
    } else if (startTimeMinutes >= 30 && startTimeMinutes < 35) {
      startTimeMinutes = 30;
      endTimeMinutes = 35;
    } else if (startTimeMinutes >= 35 && startTimeMinutes < 40) {
      startTimeMinutes = 35;
      endTimeMinutes = 40;
    } else if (startTimeMinutes >= 40 && startTimeMinutes < 45) {
      startTimeMinutes = 35;
      endTimeMinutes = 40;
    } else if (startTimeMinutes >= 45 && startTimeMinutes < 50) {
      startTimeMinutes = 45;
      endTimeMinutes = 50;
    } else if (startTimeMinutes >= 50 && startTimeMinutes < 55) {
      startTimeMinutes = 50;
      endTimeMinutes = 55;
    } else if (startTimeMinutes >= 55) {
      startTimeMinutes = 55;
      endTimeMinutes = 0;
    }

    startTimeMinutes = addLeadZero(startTimeMinutes);
    endTimeMinutes = addLeadZero(Number(endTimeMinutes));

    let nextHour: any = Number(startTimeInNumber) + 60* 60 * 1000;
    nextHour = moment(nextHour)
      .format('YYYY-MM-DD HH:mm:ss')
      .trim().split(' ')[1].split(':')[0];
    const endTimeHours =  endTimeMinutes === '00' ? nextHour : startTimeHours;
    
    return {startTimeHours, startTimeMinutes, endTimeHours, endTimeMinutes};
  }


  private updateExchangeRate() {
    return new Promise((resolve, reject) => {
      const startTimeLocal = new Date();

      const { startTimeHours, startTimeMinutes, endTimeHours, endTimeMinutes } = this.getCurrentUpdatePeriod(startTimeLocal);

      const lastUpdatedAt = new Date(startTimeLocal);
      lastUpdatedAt.setHours(startTimeHours);
      lastUpdatedAt.setMinutes(startTimeMinutes);
      lastUpdatedAt.setSeconds(0);
      lastUpdatedAt.setMilliseconds(0);

      if(!this.last_updated_at || (Number(lastUpdatedAt) > Number(this.last_updated_at))) {
        // keep
      } else {
        return resolve({});
      }

      const startTimeMoscowTimezone = new Date(startTimeLocal.toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
      const periodMoscowTimezone = this.getCurrentUpdatePeriod(startTimeMoscowTimezone);

      const startTimeGreaterPeriodStarts = Number(periodMoscowTimezone['startTimeHours']) >= Number(WorkerService.UPDATE_EXCHANGE_RATE_PERIOD_STARTS_AT_IN_MOSCOW_TIMEZONE.split(':')[0]);
      const startTimeLessPeriodEnds = Number(periodMoscowTimezone['endTimeHours']) <= Number(WorkerService.UPDATE_EXCHANGE_RATE_PERIOD_ENDS_AT_IN_MOSCOW_TIMEZONE.split(':')[0]);

      if(startTimeGreaterPeriodStarts && startTimeLessPeriodEnds) {
        // keep
      } else {
        return resolve({});
      }

      const tryRetrieveExchangeRateList = () => {
        this.logger.debug(
          `[workerService] retrieveExchangeRateList`,
        );
        return new Promise((rs, rj) => {
          this.retrieveExchangeRateList().then((res)=>{
            rs(res);
          }).catch(() => {
            setTimeout(() => {
              tryRetrieveExchangeRateList().then((res) => {
                rs(res);
              });
            }, 1000);
          });
        });
      };

      tryRetrieveExchangeRateList().then((res: any) => {
        this.listExchangeRate = res;
        this.last_updated_at = lastUpdatedAt;

        return Promise.resolve(res);
      }).then((res) => {
        const dumpFileName = `${process.env.ROOT_DIR}/tmp/exchangeRate.json`;

        this.logger.debug(
          `[workerService] write into file`,
        );

        fs.writeFile(
          dumpFileName,
          JSON.stringify({
            last_updated_at: this.last_updated_at,
            items: res
          }),
          (err) => {
            if (err) return reject(err);

            resolve({});
          },
        );
      });

    });
  }


  public static PROCESS_QUEUE_NO_TIMEOUT = -1;

  protected processQueueStartTime;
  startUpdateExchangeRate = (timeout) => {
    return new Promise((resolve, reject) => {
      if (!this.processQueueStartTime) {
        this.processQueueStartTime = Number(new Date());
      }

      this.logger.debug(
        `[workerService] idle updateExchangeRate`,
      );

      this.updateExchangeRate()
        .then(() => {

          const canBreak =
            timeout === WorkerService.PROCESS_QUEUE_NO_TIMEOUT
              ? false
              : Number(new Date()) - this.processQueueStartTime >= timeout;
          if (canBreak) {
            this.logger.debug(
              `[workerService] exit updateExchangeRate by timeout ${timeout}`,
            );

            return resolve({});
          }

          setTimeout(() => {
            this.startUpdateExchangeRate(timeout).then(resolve).catch(reject);
          }, 1000);
        })
        .catch(reject);
    });
  };

}
