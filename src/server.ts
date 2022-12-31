import express from 'express';
import * as http from 'http';
import { exit } from 'process';
import { Container } from 'typedi';
import * as WebSocket from 'ws';

import { MainController } from './controllers';
import { ConsoleLogger } from './utils';

const logger = Container.get(ConsoleLogger);

const app = express();
const server = http.createServer(app);

if (!server) {
    logger.error("Could not create the server");
    exit(1);
}

const wss = new WebSocket.Server({ server });

const Controller = Container.get(MainController);

wss.on('connection', (ws: WebSocket) => {
    Controller.init(ws);

    ws.on('message', (message: string) => {
        Controller.processMessage(ws, message);
    });

    ws.on('close', () => {
        Controller.close(ws);
    });
});

const port = process.env.PORT || 8999;
server.listen(port, () => {
    logger.log(`Server started on port ${port}`);
});