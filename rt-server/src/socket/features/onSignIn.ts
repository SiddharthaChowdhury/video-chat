import { IdSocketKey } from "../IdSocketKey"

export const onSignIn = (client: any, clients: any) => {
    client.on(IdSocketKey.ClientCanIjoin, (userInfo: {id: number, name: string}) => {
        const userCount = Object.keys(clients).length;

        if(userCount < 2 && !clients[userInfo.id]) {
            client.emit(IdSocketKey.CreatePeer);
            console.log('create peer')

            client['myId'] = userInfo;
            clients[userInfo.id] = [client] // should containe userInfo

            const onlineUserIdList = Object.keys(clients);
            for(let user in clients) {
                clients[user].forEach((clientSession: any) => {
                    clientSession.emit(IdSocketKey.onlineUsers, onlineUserIdList)
                })
            }

            return;
        }
        console.log(clients)

        client.emit(IdSocketKey.SessionFull);
    })
}