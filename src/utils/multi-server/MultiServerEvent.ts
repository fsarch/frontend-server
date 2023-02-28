import type { IServerDiscovery } from './IServerDiscovery.js';
import * as net from 'net';
import { v4 as uuid } from 'uuid';
import StreamCombiner from './StreamCombiner.js';
import EventEmitter from 'events';

export type MultiServerEventOptions = {
    serverDiscovery: IServerDiscovery;
    port: number;
};

export default class MultiServerEvent {
    private serverId: string = uuid();

    private readonly _options: MultiServerEventOptions;

    private readonly eventEmitter = new EventEmitter();

    constructor(options: MultiServerEventOptions) {
        this._options = options;

        this.eventEmitter.on = this.eventEmitter.on.bind(this);
        this.eventEmitter.off = this.eventEmitter.off.bind(this);
        this.eventEmitter.emit = this.eventEmitter.emit.bind(this);
    }

    async send(eventName: string, payload: any) {
        this._options.serverDiscovery.getServers().forEach((server) => {
            const client = new net.Socket();

            client.on('error', () => {
                client.destroy();
            });

            client.connect(this._options.port, server.host, () => {
                client.write(JSON.stringify({
                    name: eventName,
                    payload,
                    source: this.serverId,
                }) + '\n', () => {
                    console.log('written data to server', server);
                    client.destroy();
                });
            });
        });
    }

    async listen() {
        const server = net.createServer((socket) => {
            const streamCombiner = new StreamCombiner();

            socket.on('data', (data) => {
                const stringDataArray = streamCombiner.addChunk(data.toString());

                stringDataArray.forEach((stringData) => {
                    try {
                        const parsedData = JSON.parse(stringData);

                        if (parsedData.source === this.serverId) {
                            return;
                        }

                        if (parsedData.name) {
                            this.eventEmitter.emit(parsedData.name, parsedData.payload);
                        }
                    } catch (e: any) {
                        console.error(e);
                    }
                });
            });
        });

        return new Promise<void>((resolve, reject) => {
            server.listen(this._options.port, () => {
                resolve();
            });
        });
    }

    on(eventName: string, cb: (data: any) => void): (() => void) {
        this.eventEmitter.on(eventName, cb);

        return () => {
            this.eventEmitter.off(eventName, cb);
        };
    }
}
