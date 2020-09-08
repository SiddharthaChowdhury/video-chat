import express from 'express';
import http from 'http';
import socket from 'socket.io';
import cors from 'cors';
import { IdSocketKey } from './socket/IdSocketKey';
import { onSignIn } from './socket/features/onSignIn';
import { onUserDisconnect } from './socket/features/onDisconnect';

const app = express()
const PORT = 8002;
const server = http.createServer(app);
const io = socket(server);
export const clients: any = {}; // TODO: move to redis

io.on(IdSocketKey.connection, (client: any) => {
    onSignIn(client, clients);

    client.on('Offer', (offer: any) => {
		console.log('Offer from ', client['myId'])
		client.broadcast.emit("BackOffer", offer)
	});

	client.on('Answer', (answer: any) => {
		console.log('Answer from ', client['myId'])
		client.broadcast.emit("BackAnswer", answer)
	});

    onUserDisconnect(client, clients);
});

app.use(cors({credentials: true, origin: 'http://localhost:3000'}));

server.listen(PORT, () =>
  console.log(`Example app listening on port ${PORT}!`)
);
