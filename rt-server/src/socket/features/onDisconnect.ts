import { IdSocketKey } from "../IdSocketKey"

export const onUserDisconnect = (client: any, clients: any, rooms: any) => {
    client.on(IdSocketKey.disconnect, () => {
        if(!client['myId']) {
            return;
        }

        const user_id = client['myId'].id;

        const sessionId = client['sessionId'];
        if ( !clients[user_id]) {
            return;
        }


        if ( !clients[user_id][sessionId]) {
            return;
        }

        clients[user_id][sessionId] = undefined;
        delete clients[user_id][sessionId];

        const remainingUserSessionsCount = Object.keys(clients[user_id]).length;
        if(remainingUserSessionsCount === 0) {
            clients[user_id] = undefined;;
            delete clients[user_id];
        }
        // Let every one know someone left
        const onlineClients = Object.keys(clients);
        if(onlineClients.length > 0) {
            for(let userId in clients) {
                const userSessions = Object.values(clients[userId]);

                userSessions.forEach((clientSession: any) => {
                    clientSession.emit(IdSocketKey.onlineUsers, onlineClients)
                })
            }
        }
    })
}