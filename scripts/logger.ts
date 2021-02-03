import * as chalk from 'chalk';

export const Logger = {
  info(msg: string) {
    console.log(chalk.bgWhite(chalk.black('[ INFO ] ')), msg);
  },
  warn(msg: string) {
    console.log(chalk.bgYellow(chalk.black('[ WARNING ] ')), msg);
  },
  error(msg: string) {
    console.log(chalk.bgRed(chalk.black('[ ERROR ] ')), msg);
  },
  success(msg: string) {
    console.log(chalk.bgGreen(chalk.black('[ SUCCESS ] ')), msg);
  },
};
