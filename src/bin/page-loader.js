#!/usr/bin/env node

import program from 'commander';
import saveData, { errmsg } from '..';

program
  .version('0.1.0')
  .option('-o, --output [path]', 'Save page locally')
  .arguments('<urlAdress>')
  .description('Takes url adress and downloads page locally')
  .action((urlAdress) => {
    saveData(program.output, urlAdress)
      .catch((err) => {
        console.log(errmsg(err));
        process.exit(1);
      });
  })
  .parse(process.argv);

