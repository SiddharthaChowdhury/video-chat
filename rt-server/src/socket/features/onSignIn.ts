import { IdSocketKey } from "../IdSocketKey"

export const onSignIn = (client: any, clients: any) => {
    client.on(IdSocketKey.login, (userInfo: {id: number, name: string}) => {

        client['sessionId'] = + new Date();
        client['myId'] = userInfo;

        if(!clients[userInfo.id]) {
            clients[userInfo.id] = {
                [client['sessionId']]: client
            }; // Because user can log in from multiple system
        } else {
            const activeSessions = Object.keys(clients[userInfo.id]).length;
            if(activeSessions === 3) {
                client.emit(IdSocketKey.userSessionLimit, activeSessions);

                return;
            }

            clients[userInfo.id][client['sessionId']] = client         
        }

        const onlineUserIdList = Object.keys(clients);
        for(let userId in clients) {
            const sessions = Object.values(clients[userId]);
            sessions.forEach((clientSession: any) => {
                clientSession.emit(IdSocketKey.onlineUsers, onlineUserIdList)
            })
        }

        console.log('just joined', client['sessionId']);
        // console.log('onlin eusers', onlineUserIdList)
        
        // clientSession.emit(IdSocketKey.onlineUsers, onlineUserIdList)

        // const userCount = Object.keys(clients).length;

        // if(userCount < 2 && !clients[userInfo.id]) {
        //     console.log('emitting create peer', userInfo.id);
        //     client.emit(IdSocketKey.CreatePeer);

        //     client['myId'] = userInfo;
        //     clients[userInfo.id] = [client] // should containe userInfo

        //     return;
        // }

        // client.emit(IdSocketKey.SessionFull);
    })
}