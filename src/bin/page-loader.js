#!/usr/bin/env node

import program from 'commander';
import saveData from '..';

program
  .version('0.1.0')
  .arguments('<urlAdress>')
  .option('-o, --output [path]', 'Save page locally')
  .description('Takes url adress and downloads page locally')
  .action((urlAdress) => {
    saveData(program.output, urlAdress);
  })
  .parse(process.argv);

