import axios from 'axios';
import fs from 'mz/fs';
import path from 'path';
import cheerio from 'cheerio';
import url from 'url';
import debug from 'debug';

const logDebug = debug('page-loader');

const attrMapping = {
  script: {
    name: 'src',
    isSuitable: pathname => !pathname.includes('//'),
  },
  link: {
    name: 'href',
    isSuitable: (pathname, el, data) => !pathname.includes('//') && data(el).attr('rel') === 'stylesheet',
  },
  img: {
    name: 'src',
    isSuitable: () => true,
  },
};

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

const isAttrLinkInternal = (el, data, hostname) => {
  const targetAttr = attrMapping[el.name].name;
  if (!data(el).attr(targetAttr)) {
    return false;
  }
  const pathnameToCheck = url.parse(data(el).attr(targetAttr)).pathname;
  if (attrMapping[el.name].isSuitable(pathnameToCheck, el, data)) {
    logDebug('suitable url %s', pathnameToCheck);
    const attrUrlObj = url.parse(data(el).attr(targetAttr));
    const attrHostname = attrUrlObj.hostname;
    if (!attrHostname || attrHostname === hostname) {
      return true;
    }
  }
  return false;
};

const getAllFilteredElements = ($, hostname) => {
  const elements = Object.keys(attrMapping).reduce((cur, acc) => `${acc}, ${cur}`);
  const targetElems = $(elements);
  return targetElems.filter((index, el) => isAttrLinkInternal(el, $, hostname));
};

const findLink = ($, element, { protocol, hostname }) => {
  const targetAttr = attrMapping[element.name].name;
  const urlAdress = $(element).attr(targetAttr);
  const host = url.parse(urlAdress).hostname;
  const adressToDownload = !host ? `${protocol}//${hostname}/${urlAdress}` : urlAdress;
  const fileName = makeAssetName(adressToDownload);
  return { adressToDownload, fileName };
};


const parseHtml = (data, urlObj, assetsFolder) => {
  const $ = cheerio.load(data);
  const elemsToCheck = getAllFilteredElements($, urlObj.hostname);
  elemsToCheck.each((ind, el) => {
    const attribute = attrMapping[el.name].name;
    const { fileName } = findLink($, el, urlObj);
    $(el).attr(attribute, `${assetsFolder}/${fileName}`);
  });
  logDebug('parsed html');
  return $.html();
};

const makePromisesArr = (html, urlObj, assetsPath) => {
  const $ = cheerio.load(html);
  const elements = getAllFilteredElements($, urlObj.hostname);
  const promises = elements.map((ind, el) => {
    const { adressToDownload, fileName } = findLink($, el, urlObj);
    return axios.request({
      responseType: 'arraybuffer',
      url: adressToDownload,
      method: 'get',
    }).then(response => fs.writeFile(path.join(assetsPath, fileName), response.data));
  });
  logDebug('made promises arr from filtered elements');
  return promises.toArray();
};

const saveData = (folder, adress) => {
  let html;
  let assetsPromises;
  const folderAssetsName = makeName(adress, '_files');
  const pathToMainFile = path.resolve(folder, makeName(adress, '.html'));
  const pathToAssets = path.resolve(folder, folderAssetsName);
  const urlObj = url.parse(adress);
  logDebug('begin of async tasks');
  return axios.get(adress)
    .then((response) => {
      const { data } = response;
      logDebug('received html from %s', adress);
      assetsPromises = makePromisesArr(data, urlObj, pathToAssets);
      html = parseHtml(data, urlObj, folderAssetsName);
    })
    .then(() => fs.mkdir(pathToAssets))
    .then(() => Promise.all(assetsPromises))
    .then(() => fs.writeFile(pathToMainFile, html))
    .then(() => logDebug('programm ended succesfully'))
    .catch(err => logDebug('programm ended with %o', err));
};

export default saveData;

