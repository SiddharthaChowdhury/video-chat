import { IdSocketKey } from "../IdSocketKey"

export const onUserDisconnect = (client: any, clients: any) => {
    client.on(IdSocketKey.disconnect, () => {
        if(!client['myId']) {
            return;
        }

        const user_id = client['myId'].id;
        if ( !clients[user_id]) {
            return;
        }

        // Let every one know someone left
        const onlineClients = Object.keys(clients);
        if(onlineClients.length > 0) {
            for(let user in clients) {
                clients[user].forEach((clientSession: any) => {
                    clientSession.emit(IdSocketKey.onlineUsers, onlineClients)
                })
            }
        }
    })
}