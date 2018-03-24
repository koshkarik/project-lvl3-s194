import nock from 'nock';
import axios from 'axios';
import fsMz from 'mz/fs';
import fs from 'fs';
import path from 'path';
import os from 'os';
import httpAdapter from 'axios/lib/adapters/http';
import saveData from '../src';

const host = 'https://fake.com';
const imagePath = '/images/somefile.jpg';
const cssPath = '/styles/style.css';
const folderForAssets = '/fake-com_files';
const downloadedImgName = 'images-somefile.jpg';
const downloadedCssName = 'styles-style.css';

const fixturesPath = '__tests__/__fixtures__';
axios.defaults.adapter = httpAdapter;

test('download page and save it', async () => {
  const nockPage = await fsMz.readFile(path.join(fixturesPath, 'testPage.html'), 'utf8');
  const expectedPage = await fsMz.readFile(path.join(fixturesPath, 'expectedTestPage.html'), 'utf8');
  const testImage = await fsMz.readFile(path.join(fixturesPath, imagePath), 'utf8');
  const testCssFile = await fsMz.readFile(path.join(fixturesPath, cssPath), 'utf8');

  nock(host).get('/').reply(200, nockPage);
  nock(host).get(imagePath).reply(200, testImage);
  nock(host).get(cssPath).reply(200, testCssFile);

  const tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'bar-'));
  await saveData(tmpFolder, host);
  const pathToFile = path.join(tmpFolder, 'fake-com.html');
  const pathToImageFile = path.join(tmpFolder, folderForAssets, downloadedImgName);
  const pathToCssFile = path.join(tmpFolder, folderForAssets, downloadedCssName);
  const downloadedPage = await fsMz.readFileSync(pathToFile, 'utf8');
  const downloadedImage = await fsMz.readFileSync(pathToImageFile, 'utf8');
  const downloadedCss = await fsMz.readFileSync(pathToCssFile, 'utf8');

  expect(downloadedPage).toBe(expectedPage);
  expect(downloadedImage).toBe(testImage);
  expect(downloadedCss).toBe(testCssFile);
});
