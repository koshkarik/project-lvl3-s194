import url from 'url';

const makeFileName = (urlAdress) => {
  const { hostname, pathname } = url.parse(urlAdress);
  const urlPath = pathname.length > 1 ? pathname : '';
  const urlName = hostname.concat(urlPath);
  return urlName.replace(/[^a-zA-Z0-9]+/g, '-').concat('.html');
};

export default makeFileName;
