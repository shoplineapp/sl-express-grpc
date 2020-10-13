const Definition = require('./Definition');
const GRpcServer = require('./gRpcServer');
const GRpcClient = require('./gRpcClient');

class gRpcPlugin {
  constructor() {
    this.GRpcClient = GRpcClient;
  }

  didLoadFramework(app) {
    if (app.config.grpc.server) {
      const {
        config: {
          grpc: { server: config },
        },
      } = app;
      const { autoloadPaths, port, packageName } = config;
      Definition.preload(autoloadPaths);
      app.gRpcServer = new GRpcServer('0.0.0.0', port, {
        packageName,
        autoloadPaths,
      });
    }
  }
}

module.exports = gRpcPlugin;
