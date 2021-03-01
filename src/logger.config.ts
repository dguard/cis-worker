import winston, { format, transports } from 'winston';

const moment = require('moment');
const chalk = require('chalk');

export default class LoggerConfig {
  private readonly options: winston.LoggerOptions;

  constructor() {
    this.options = {
      exitOnError: false,
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf((msg) => {
          const timestamp = moment(msg.timestamp)
            .format('YYYY-MM-DD HH:mm:ss')
            .trim();

          return `${chalk.magenta('[cis-worker]')} ${chalk.magenta(timestamp)} [${
            msg.level
          }] - ${msg.message}`;
        }),
      ),
      // alert > error > warning > notice > info > debug
      transports: [new transports.Console({ level: 'debug' })],
    };
  }

  public console(): object {
    return this.options;
  }
}
