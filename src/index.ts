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
    listenHttp
} from './server';

async function main() {
    const server = listenHttp(8080);

    console.log('Server now running ...');
    for await (const connection of server) {
        // destruct all we need for handling a connection
        // in this demo ...
        const {
            request, response
        } = connection;
        const {
            socket,
        } = request;

        try {
            console.log(`Connection established with ${socket.remoteAddress}:${socket.remotePort} =>`, `[${request.method}] ${request.url}`);

            const message = Buffer.from(
                'OK', 'utf8'
            );

            response.writeHead(200, {
                'Content-Type': 'text/plain; charset=UTF-8',
                'Content-Length': String(message.length)
            });

            response.write(message);
        } catch (error) {
            const errorMessage = Buffer.from(
                String(error), 'utf8'
            );

            if (!response.headersSent) {
                response.writeHead(500, {
                    'Content-Type': 'text/plain; charset=UTF-8',
                    'Content-Length': String(errorMessage.length)
                });
            }

            response.write(errorMessage);
        } finally {
            response.end();

            console.log('Connection closed with', socket.remoteAddress, socket.remotePort);
        }
    }
}

main().catch(console.error);
