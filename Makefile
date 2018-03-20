install:
	npm install

start:
	npm run babel-node -- src/bin/page-loader.js	

lint:
	npm run eslint .	

publish:
	npm publish

test:
	npm test

build:
	rm -rf dist
	npm run build	