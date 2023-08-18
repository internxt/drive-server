import Agent from 'agentkeepalive';
import axios from 'axios';

function createHttpAgent() {
  return new Agent({
    keepAlive: true,
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 10000,
    freeSocketTimeout: 30000,
  });
}

function createHttpsAgent() {
  return new Agent.HttpsAgent({
    keepAlive: true,
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 10000,
    freeSocketTimeout: 30000,
  });
}

export function configureHttp(): void {
  axios.defaults.httpAgent = createHttpAgent();
  axios.defaults.httpsAgent = createHttpsAgent();
}