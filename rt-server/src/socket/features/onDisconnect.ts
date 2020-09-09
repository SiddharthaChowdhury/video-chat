import { IdSocketKey } from "../IdSocketKey"
import socket from 'socket.io';

export const onUserDisconnect = (client: any, clients: any, io: socket.Server) => {
    client.on(IdSocketKey.disconnect, () => {
        console.log('Disconnection', client['myId'], 'sessionId', client.id)
        if(!client['myId']) {
            return;
        }

        const user_id = client['myId'].id;
        const socketId = client.id;

        if ( !clients[user_id]) { // User is a registered client
            return;
        }

        // Remove current session form User session Array
        const userSessionArr: string[] = clients[user_id].ioId;
        const index = userSessionArr.indexOf(socketId);
        if(index > -1) {
            userSessionArr.splice(index, 1); 

            // When user has no session left
            if(userSessionArr.length === 0) {
                // remove user from registry
                clients[user_id] = undefined;
                delete clients[user_id];

                // Broadcast fresh list of active users to existing users;
                const onLineUsers = Object.keys(clients).map((uid: string) => ({...clients[uid], ioId: undefined}));
        
                Object.keys(clients).forEach((clientKey: string) => {
                    clients[clientKey].ioId.forEach((socketId: any) => {
                        io.to(socketId).emit(IdSocketKey.onlineUsers, onLineUsers)
                    })
                });

            } else { 
                // Remove current session from his list of sessions
                clients[user_id].ioId = [...userSessionArr];
            }
        }
    })
}