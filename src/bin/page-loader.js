#!/usr/bin/env node

import program from 'commander';
import saveData from '..';

program
  .version('0.1.0')
  .option('-o, --output [path]', 'Save page locally')
  .arguments('<urlAdress>')
  .description('Takes url adress and downloads page locally')
  .action((urlAdress) => {
    saveData(program.output, urlAdress)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  })
  .parse(process.argv);

