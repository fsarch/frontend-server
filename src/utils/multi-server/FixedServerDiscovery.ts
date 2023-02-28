import type {
    DiscoveredServer, IServerDiscoveredEvent,
    IServerDiscovery,
    ServerDiscoveredHandler,
    ServerLostHandler
} from './IServerDiscovery.js';
import EventEmitter from 'events';

type FixedServerDiscoveryOptions = {
    servers: string[];
};

export default class FixedServerDiscovery implements IServerDiscovery {
    private readonly _options: FixedServerDiscoveryOptions;

    private readonly eventEmitter = new EventEmitter();

    private readonly servers: DiscoveredServer[] = [];

    constructor(options: FixedServerDiscoveryOptions) {
        this._options = options;

        this.eventEmitter.on = this.eventEmitter.on.bind(this);
        this.eventEmitter.off = this.eventEmitter.off.bind(this);
        this.eventEmitter.emit = this.eventEmitter.emit.bind(this);

        options.servers.forEach((server) => {
            this.handleServerDiscovered({
                host: server,
            });
        });
    }

    getServers(): DiscoveredServer[] {
        return this.servers;
    }

    onServerDiscovered(cb: ServerDiscoveredHandler) {
        this.eventEmitter.on('serverDiscovered', cb);

        return () => {
            this.eventEmitter.off('serverDiscovered', cb);
        };
    }

    onServerLost(cb: ServerLostHandler) {
        this.eventEmitter.on('serverLost', cb);

        return () => {
            this.eventEmitter.off('serverLost', cb);
        };
    }

    private handleServerDiscovered(server: DiscoveredServer) {
        this.servers.push(server);

        const event: IServerDiscoveredEvent = {
            server,
        };

        this.eventEmitter.emit('serverDiscovered', event);
    }
}
