import nock from 'nock';
import axios from 'axios';
import fs from 'mz/fs';
import path from 'path';
import os from 'os';
import httpAdapter from 'axios/lib/adapters/http';
import saveData from '../src';

const host = 'https://fake.com';
const fixturesPath = '__tests__/__fixtures__';
axios.defaults.adapter = httpAdapter;

test('download page and save it', async () => {
  const nockPage = await fs.readFile(path.join(fixturesPath, 'test.html'), 'utf8');
  nock(host).get('/').reply(200, nockPage);
  const tmpFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'bar-'));
  await saveData(tmpFolder, host);
  const pathToFile = '.'.concat(path.resolve(tmpFolder, 'fake-com.html'));
  const downloadedPage = await fs.readFileSync(pathToFile, 'utf8');
  expect(downloadedPage).toBe(nockPage);
});
