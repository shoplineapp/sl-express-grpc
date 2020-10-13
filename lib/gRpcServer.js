const grpc = require('grpc');
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
    this.router = new GRpcRouter();
    this.errorHandler = undefined; // Allow app to override error handler on it's need
  }

  run() {
    const server = new grpc.Server();

    this.services = Definition.loadServices(this.packageName);

    Object.keys(this.services).forEach((resource) => {
      if (app.controllers[`${resource}Controller`]) {
        const handlers = getMethodNames(app.controllers[`${resource}Controller`]).reduce((mappings, key) => {
          mappings[key] = (req, res) => {
            return this.router.request(req, res, {
              resource,
              action: key,
              errorHandler: this.errorHandler,
            });
          };
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
