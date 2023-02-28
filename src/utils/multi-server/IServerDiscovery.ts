
type EventHandler<T> = (event: T) => void;

export type DiscoveredServer = {
    host: string;
};

export interface IServerDiscoveredEvent {
    server: DiscoveredServer;
}

export interface IServerLostEvent {
    server: DiscoveredServer;
}

export type ServerLostHandler = EventHandler<IServerLostEvent>;
export type ServerDiscoveredHandler = EventHandler<IServerDiscoveredEvent>;

type CleanupCallback = () => void;

export interface IServerDiscovery {
    onServerDiscovered(cb: ServerDiscoveredHandler): CleanupCallback;

    onServerLost(cb: ServerLostHandler): CleanupCallback;

    getServers(): DiscoveredServer[];
}
