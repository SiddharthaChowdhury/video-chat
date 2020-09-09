import { IdSocketKey } from "../IdSocketKey";
import socket from 'socket.io';

export const onSignIn = (client: any, clients: any, io: socket.Server) => {
    client.on(IdSocketKey.login, (userInfo: {id: number, name: string}) => {
        const clientSocketId = client.id;
        client['myId'] = userInfo;

        // handle new client
        if(!clients[userInfo.id]) {
            clients[userInfo.id] = {
                ...userInfo,
                ioId: [clientSocketId]
            };
        } else {
            const sessionCount = clients[userInfo.id].ioId.length;
            if(sessionCount === 3) {
                client.emit(IdSocketKey.userSessionLimit, sessionCount);

                return;
            }
            clients[userInfo.id] = {
                ...userInfo,
                ioId: [
                    ...clients[userInfo.id].ioId,
                    clientSocketId
                ]
            };
        }
        
        // Broadcast fresh list of active users to existing users;
        const onLineUsers = Object.keys(clients).map((uid: string) => ({...clients[uid], ioId: undefined}));

        Object.keys(clients).forEach((clientKey: string) => {
            clients[clientKey].ioId.forEach((socketId: any) => {
                io.to(socketId).emit(IdSocketKey.onlineUsers, onLineUsers)
            })
        });
    })
}