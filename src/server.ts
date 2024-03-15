// MIT License
//
// Copyright (c) 2024 Marcel Joachim Kloubert (https://marcel.coffee)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import {
    EventEmitter
} from 'node:events';
import {
    createServer,
    IncomingMessage,
    Server,
    ServerResponse
} from 'node:http';

type HttpIterator = AsyncIterator<IHttpConnection, any, undefined>;

type HttpIteratorResult = IteratorResult<IHttpConnection, any>;

/**
 * A connection between a HTTP server and a remote client.
 */
export interface IHttpConnection {
    /**
     * The request context.
     */
    request: IncomingMessage;
    /**
     * The response context.
     */
    response: ServerResponse;
}

/**
 * A HTTP server.
 */
export interface IHttpServer extends AsyncIterable<IHttpConnection>, NodeJS.EventEmitter {
}

class HttpServer extends EventEmitter implements IHttpServer {
    constructor(
        public readonly instance: Server,
        private readonly _iterator: HttpIterator
    ) {
        super();
    }

    [Symbol.asyncIterator](): HttpIterator {
        return this._iterator;
    }
}

/**
 * Creates and starts a new `IHttpServer`.
 *
 * @param {number|string} [port=8080] The custom TCP port.
 * 
 * @returns {IHttpServer} The new running HTTP server.
 */
export function listenHttp(port: number | string = 8080): IHttpServer {
    const instance = createServer();

    const iterator: HttpIterator = {
        next: () => {
            return new Promise<HttpIteratorResult>((resolve, reject) => {
                instance.once('error', (error) => {
                    reject(error);
                });

                instance.once('request', (request, response) => {
                    const newConnection: IHttpConnection = {
                        request,
                        response
                    };

                    resolve({
                        done: false,
                        value: newConnection
                    });
                });
            });
        }
    };

    const server = new HttpServer(instance, iterator);

    // proxy from Node server instance
    // to own `HttpServer` instance
    server.instance.on('error', (instanceError) => {
        server.emit('error', instanceError);
    });

    // now start listening
    server.instance.listen(Number(port), '0.0.0.0');

    return server;
}
