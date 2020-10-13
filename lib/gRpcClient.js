const inflection = require('inflection');
const grpc = require('grpc');
const Definition = require('./Definition');

class gRpcClient {
  constructor(packageName, autoLoadPaths) {
    this.serviceName = inflection.underscore(packageName);

    this.endpoint =
      process.env[`GRPC_${this.serviceName}_ENDPOINT`.toUpperCase()];

    Definition.preload(autoLoadPaths);

    this.services = Definition.loadServices(packageName);
  }
  request(serviceName, methodName, payload) {
    const Service = this.services[serviceName];
    const client = new Service(
      this.endpoint,
      grpc.credentials.createInsecure(),
    );
    return new Promise((resolve, reject) => {
      client[methodName](payload, (err, res) => {
        if (err) {
          return reject(err);
        }
        return resolve(res);
      });
    });
  }
}

module.exports = gRpcClient;
