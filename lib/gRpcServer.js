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
    this.server = undefined;
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
    this.server = new grpc.Server();
    this.configureRouter();

    this.services = Definition.loadServices(this.packageName);

    Object.keys(this.services).forEach((resource) => {
      if (app.controllers[`${resource}Controller`]) {
        const handlers = getMethodNames(
          app.controllers[`${resource}Controller`]
        ).reduce((mappings, key) => {
          mappings[key] = this.generateRequestHandler(resource, key);
          return mappings;
        }, {});

        this.server.addService(this.services[resource].service, handlers);
      }
    });

    this.server.bind(
      `${this.ip}:${this.port}`,
      grpc.ServerCredentials.createInsecure()
    );
    log('sl-express', 'info', { message: `Starting grpc server on 0.0.0.0:${this.port}` });
    return this.server.start();
  }

  stop() {
    if (!this.server) return;

    return new Promise((resolve, reject) => {
      const timeoutID = setTimeout(() => {
        log('sl-express', 'error', {
          message: `Timeout error while trying to stop grpc server`,
        });

        reject(new Error('Timeout error while trying to stop grpc server'));
      }, 1000 * 5);

      try {
        this.server.tryShutdown(() => {
          log('sl-express', 'info', {
            message: `Shutting down grpc server on 0.0.0.0:${this.port}`,
          });

          clearTimeout(timeoutID);
          resolve();
        });
      } catch (error) {
        log('sl-express', 'error', {
          message: error,
        });

        clearTimeout(timeoutID);
        reject(error);
      }
    });
  }
}

module.exports = GRpcServer;
