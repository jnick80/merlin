import { AddressInfo } from 'node:net';
import http, { IncomingMessage, ServerResponse } from 'node:http';
import app from '../src/index';

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

interface JsonObject {
  [key: string]: JsonValue;
}

const readResponseBody = async (response: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    let data = '';
    response.setEncoding('utf8');
    response.on('data', (chunk: string) => {
      data += chunk;
    });
    response.on('end', () => resolve(data));
    response.on('error', reject);
  });

const requestJson = async (
  port: number,
  path: string
): Promise<{ statusCode: number; body: JsonObject }> =>
  new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path,
        method: 'GET'
      },
      async (res: IncomingMessage) => {
        try {
          const body = await readResponseBody(res);
          resolve({
            statusCode: res.statusCode ?? 0,
            body: JSON.parse(body) as JsonObject
          });
        } catch (error) {
          reject(error);
        }
      }
    );

    req.on('error', reject);
    req.end();
  });

describe('app routes', () => {
  let server: http.Server<typeof IncomingMessage, typeof ServerResponse>;
  let port: number;

  beforeAll(async () => {
    server = app.listen(0);
    await new Promise<void>((resolve) => {
      server.on('listening', () => resolve());
    });
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it('returns a health response', async () => {
    const response = await requestJson(port, '/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('returns API metadata for v1 root', async () => {
    const response = await requestJson(port, '/api/v1');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      name: 'Merlin Business OS API',
      version: 'v1',
      status: 'ok'
    });
  });
});
