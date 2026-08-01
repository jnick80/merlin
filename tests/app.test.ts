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

const makeRequest = async (
  port: number,
  path: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
): Promise<{ statusCode: number; body: string; headers: IncomingMessage['headers'] }> =>
  new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path,
        method: options?.method || 'GET',
        headers: options?.headers
      },
      async (res: IncomingMessage) => {
        try {
          resolve({
            statusCode: res.statusCode ?? 0,
            body: await readResponseBody(res),
            headers: res.headers
          });
        } catch (error) {
          reject(error);
        }
      }
    );

    req.on('error', reject);
    if (options?.body) {
      req.write(options.body);
    }
    req.end();
  });

const requestJson = async (
  port: number,
  path: string
): Promise<{ statusCode: number; body: JsonObject; headers: IncomingMessage['headers'] }> => {
  const response = await makeRequest(port, path);

  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body) as JsonObject,
    headers: response.headers
  };
};

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

  it('serves a GUI landing page', async () => {
    const response = await makeRequest(port, '/');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.body).toContain('Merlin Business OS');
    expect(response.body).toContain('GUI entry point for the Merlin API.');
    expect(response.body).toContain('/cypherlink-icon.svg');
    expect(response.body).toContain('Cypherlink icon preview');
    expect(response.body).toContain('/cypherlink-icon/download');
    expect(response.body).toContain('/health');
    expect(response.body).toContain('/api/v1');
  });

  it('serves the Cypherlink shortcut icon', async () => {
    const response = await makeRequest(port, '/cypherlink-icon.svg');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('image/svg+xml');
    expect(response.body).toContain('<svg');
    expect(response.body).toContain('</svg>');
  });

  it('serves a downloadable Cypherlink icon', async () => {
    const response = await makeRequest(port, '/cypherlink-icon/download');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('image/svg+xml');
    expect(response.headers['content-disposition']).toContain('attachment;');
    expect(response.headers['content-disposition']).toContain('cypherlink-icon.svg');
    expect(response.body).toContain('<svg');
  });

  it('does not expose the Express signature header', async () => {
    const response = await makeRequest(port, '/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('does not allow arbitrary cross-origin access by default', async () => {
    const response = await makeRequest(port, '/health', {
      headers: { Origin: 'https://evil.example' }
    });

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects oversized JSON payloads', async () => {
    const oversizedBody = JSON.stringify({ payload: 'a'.repeat(110_000) });
    const response = await makeRequest(port, '/api/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(oversizedBody).toString()
      },
      body: oversizedBody
    });

    expect(response.statusCode).toBe(413);
  });
});
