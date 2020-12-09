const grpc = require('grpc');
const inflection = require('inflection');
const getMethodNames = require('./getMethodNames');
const Definition = require('./Definition');
const GRpcRouter = require('./gRpcRouter');

class GRpcServer {
  constructor(ip, port, extras) {
    const { packageName, autoloadPaths } = extras;
    this.ip = ip;
    this.port = port;
    this.services = {};
    this.packageName = packageName;
    this.autoloadPaths = autoloadPaths;
    this.executeRequest = undefined;
    this.executeChainStep = undefined;
    this.router = new GRpcRouter();
    this.errorHandler = undefined; // Allow app to override error handler on it's need
  }

  configureRouter() {
    this.router.executeChainStep = this.executeChainStep;
  }

  generateRequestHandler(resource, action) {
    return (req, res) => {
      // Convert GRPC upper camelcase action to lower camelcase action of controller
      const controllerAction = inflection.camelize(action, true)
      const requestOptions = [req, res, {
        resource,
        action: controllerAction,
        errorHandler: this.errorHandler,
      }];
      const handler = this.router.request.bind(this.router);
      if (this.executeRequest) {
        return this.executeRequest(handler, requestOptions);
      }
      return handler(...requestOptions);
    };
  }

  run() {
    const server = new grpc.Server();

    this.configureRouter();

    this.services = Definition.loadServices(this.packageName);

    Object.keys(this.services).forEach((resource) => {
      if (app.controllers[`${resource}Controller`]) {
        const handlers = getMethodNames(app.controllers[`${resource}Controller`]).reduce((mappings, key) => {
          mappings[key] = this.generateRequestHandler(resource, key);
          return mappings;
        }, {});

        server.addService(this.services[resource].service, handlers);
      }
    });

    server.bind(`${this.ip}:${this.port}`, grpc.ServerCredentials.createInsecure());
    log('sl-express', 'info', { message: `Starting grpc server on 0.0.0.0:${this.port}` });
    return server.start();
  }
}

module.exports = GRpcServer;
