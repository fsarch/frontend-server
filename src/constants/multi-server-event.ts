import MultiServerEvent from '../utils/multi-server/MultiServerEvent.js';
import FixedServerDiscovery from '../utils/multi-server/FixedServerDiscovery.js';

const SERVER_DISCOVERY_PORT = parseInt(process.env.SERVER_DISCOVERY_PORT ?? '0', 10);
if (!SERVER_DISCOVERY_PORT) {
    throw new Error('no SERVER_DISCOVERY_PORT specified');
}

const SERVER_DISCOVERY_IPS = process.env.SERVER_DISCOVERY_IPS;
if (!SERVER_DISCOVERY_IPS) {
    throw new Error('no SERVER_DISCOVERY_IPS specified');
}

export const MULTI_SERVER_EVENT = new MultiServerEvent({
    port: SERVER_DISCOVERY_PORT,
    serverDiscovery: new FixedServerDiscovery({
        servers: SERVER_DISCOVERY_IPS.split(','),
    }),
});
