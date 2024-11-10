import { Hocuspocus } from "@hocuspocus/server";

const disconnectTimers = new Map();
const disconnectedClients = new Map();

const destroyedSessions = new Set();
setInterval(() => {
    destroyedSessions.clear();
}, 24 * 60 * 60 * 1000);

const server = new Hocuspocus({
    port: 3003,

    async onAuthenticate(data) {
        const { token } = data;

        if (token !== "abc") {
            throw new Error("Not authorized!");
        }

        if (destroyedSessions.has(data.documentName)) {
            throw new Error("Session has ended");
        }

        return
    },

    onConfigure: data => {
        console.log('Connection being configured:', data.documentName);
    },
    onConnect: data => {
        console.log('Client connected: ', data.documentName);

        if (destroyedSessions.has(data.documentName)) {
            data.document.broadcastStateless("sessionEnded");
            data.document.destroy();
            return;
        }

        const currentCount = disconnectedClients.get(data.documentName) || 0;
        if (currentCount > 0) {
            disconnectedClients.set(data.documentName, currentCount - 1);
        }

        if (disconnectTimers.has(data.documentName) && 
            disconnectedClients.get(data.documentName) === 0) {
            clearTimeout(disconnectTimers.get(data.documentName));
            disconnectTimers.delete(data.documentName);
            console.log('Reconnected within time window');
        }
    },

    onDisconnect(data) {
        // network disconnects or last person leaves
        console.log('Client disconnected from:', data.documentName);

        if (destroyedSessions.has(data.documentName)) {
            return;
        }

        const currentCount = disconnectedClients.get(data.documentName) || 0;
        disconnectedClients.set(data.documentName, currentCount + 1);

        if (!disconnectTimers.has(data.documentName)) {
            const timeoutId = setTimeout(() => {
                // only destroy if clients are still disconnected after 1 min
                if (disconnectedClients.get(data.documentName) > 0) {
                    console.log('Reconnection window expired');
                    data.document.broadcastStateless("sessionEndedNetwork");
                    data.document.destroy();
                    disconnectTimers.delete(data.documentName);
                    disconnectedClients.delete(data.documentName);
                    destroyedSessions.add(data.documentName);
                }
            }, 60000);

            disconnectTimers.set(data.documentName, timeoutId);
            console.log('Started reconnection window');
        }
    },

    onStateless: ({ payload, document, connection }) => {
        // explicit session end
        if (payload === "endSession") {
            console.log('Session explicitly ended');
            if (disconnectTimers.has(document.name)) {
                clearTimeout(disconnectTimers.get(document.name));
                disconnectTimers.delete(document.name);
            }
            disconnectedClients.delete(document.name);
            destroyedSessions.add(document.name);
            document.broadcastStateless("sessionEnded");
            setTimeout(() => {
                document.destroy();
            }, 5000);
        }
    }
});

server.listen();