[![Build Status](https://travis-ci.org/rhases/rhases-nodejs-commons.svg?branch=develop)](https://travis-ci.org/rhases/rhases-nodejs-commons)

# Node.js Utilities

## Installation

Using npm:
```shell
$ npm i --save rhases-nodejs-commons
```

## Using

### Pino Log

```js
import l from 'rhases-nodejs-commons';

l.error(err);
l.info("foo", foo);
```
### Service Utils

```js
import {ServiceUtils} from 'rhases-nodejs-commons';

serviceUtils = new ServiceUtils(MyMongooseModel);

all() {
  return this.serviceUtils.all();
}
```
### Controller Utils

```js
import {ControllerUtils} from 'rhases-nodejs-commons';

controllerUtils = new ControllerUtils(MyService);

byId(req, res) {
  this.controllerUtils.byId(req, res);
}
```

## Control Access
