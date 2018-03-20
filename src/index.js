import axios from 'axios';
import fs from 'mz/fs';
import path from 'path';
import mkdirp from 'mkdirp-promise';
import makeFileName from './helpers';

const saveData = (folder, adress) => {
  const pathToFolder = path.join(process.cwd(), folder);
  const fileName = makeFileName(adress);
  const fullPath = path.join(path.normalize(pathToFolder), fileName);
  return axios.get(adress)
    .then((response) => {
      const { data } = response;
      return mkdirp(pathToFolder)
        .then(() => fs.writeFile(fullPath, data, 'utf8'));
    })
    .catch(err => console.log(err));
};

export default saveData;

