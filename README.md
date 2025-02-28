# sl-express-grpc

Plugin for sl-express. Use to route grpc requests with express provided framework

## Install

```
git submodule add git@github.com:shoplineapp/sl-express-grpc
```

## Usage

### GRpcClient

Can import GRpcClient with

```
const { GRpcClient } = require('<submodule-grpc-plugin-path>');
```

### GRpcServer

For sl-express, GRpcServer should be loaded with plugin, add this to `api/plugins/<plugin-name>/index.js`

```
const GRpcPlugin = require('<submodule-grpc-plugin-path>');

module.exports = new GRpcPlugin();
```

Or directly put this repo as submodule in `api/plugins`
