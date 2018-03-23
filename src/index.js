import axios from 'axios';
import fs from 'mz/fs';
import path from 'path';
import cheerio from 'cheerio';
import url from 'url';

const makeAssetName = (urlAdress) => {
  const { pathname } = url.parse(urlAdress);
  const parts = pathname.slice(1, pathname.length).split('.');
  const [ext, ...base] = parts.reverse();
  return base.join('.').replace(/[^a-zA-Z0-9]+/g, '-').concat('.'.concat(ext));
};

const makeName = (urlName, endOfName) => {
  const { hostname, pathname } = url.parse(urlName);
  const urlPath = pathname.length > 1 ? pathname : '';
  const fullName = hostname.concat(urlPath);
  return fullName.replace(/[^a-zA-Z0-9]+/g, '-').concat(endOfName);
};

const decideElsToDownload = (el, data, hostname) => {
  const pathnameToCheck = (data(el)).attr('href') ? url.parse(data(el).attr('href')).pathname
    : url.parse(data(el).attr('src')).pathname;
  if ((data(el).attr('href') && data(el).attr('rel') === 'stylesheet' && !pathnameToCheck.includes('//'))
   || (data(el).attr('src') && !pathnameToCheck.includes('//'))) {
    const targetAttr = data(el).attr('href') ? 'href' : 'src';
    const attrUrlObj = url.parse(data(el).attr(targetAttr));
    const attrHostname = attrUrlObj.hostname;
    if (!attrHostname || attrHostname === hostname) {
      return true;
    }
  }
  return false;
};

const handleTagsPushPromises =
  ($, elems, pathToAssetsFolder, promisesArr, protocol, hostname, assetsFolder) => {
    elems.each((ind, el) => {
      const targetAttr = $(el).attr('href') ? 'href' : 'src';
      const target = $(el).attr(targetAttr);
      const host = url.parse(target).hostname;
      const adressToDownload = !host ? protocol.concat(`//${hostname}/${target}`) : target;
      const fileName = makeAssetName(adressToDownload);
      $(el).attr(targetAttr, assetsFolder.concat(`/${fileName}`));
      promisesArr.push(axios.request({
        responseType: 'arraybuffer',
        url: adressToDownload,
        method: 'get',
      }).then(response => fs.writeFile(path.join(pathToAssetsFolder, fileName), response.data)));
    });
  };

const makeFolder = pathToAssetsFolder => fs.mkdir(pathToAssetsFolder);

const saveData = (folder, adress) => {
  let newdata = '';
  const assetsPromises = [];
  const folderAssetsName = makeName(adress, '_files');
  const pathToMainFile = path.resolve(folder, makeName(adress, '.html'));
  const pathToAssets = path.resolve(folder, folderAssetsName);
  const { hostname, protocol } = url.parse(adress);
  return axios.get(adress)
    .then((response) => {
      const $ = cheerio.load(response.data);
      const targetElems = $('img, link, script[src]');
      const newTargets = targetElems.filter((index, el) => decideElsToDownload(el, $, hostname));
      handleTagsPushPromises($, newTargets, pathToAssets, assetsPromises, protocol, hostname, folderAssetsName); // eslint-disable-line
      newdata = $.html();
    })
    .then(makeFolder(pathToAssets))
    .then(() => Promise.all(assetsPromises))
    .then(() => fs.writeFile(pathToMainFile, newdata))
    .catch(err => console.error(err));
};

export default saveData;

