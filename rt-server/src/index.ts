import express from 'express';
import http from 'http';
import socket from 'socket.io';
import cors from 'cors';
import { IdSocketKey } from './socket/IdSocketKey';
import { onSignIn } from './socket/features/onSignIn';
import { onUserDisconnect } from './socket/features/onDisconnect';

const app = express()
const PORT = 8000;
const server = http.createServer(app);
const io = socket(server);

const rooms: any = {};
const clients: any = {}; // TODO: move to redis

io.on(IdSocketKey.connection, (client: any) => {
    onSignIn(client, clients);

	/* *****************************************
	 				SIGNALING
	*********************************************/
	// User-A: initiator
	// User-B: joiner

	// Making possble - Joining the room
	// Logic: Any one with room-link can join the room of video conversation (Max user 2 :) )
	client.on('joinRoom', (roomId: any) => {
		if(rooms[roomId]) { // User-B
			rooms[roomId].push(client.id);
		} else { // User-A
			rooms[roomId] = [client.id];
		}

		// For User-B
		// We can only have 2 people in the room 
		// So get the other user in the room (if any)
		const theOtherUser = rooms[roomId].find((id: any) => id !== client.id);
		if(theOtherUser) {
			client.emit("otherUser", theOtherUser); // Notify current User-B that the other user (User-A) is waiting and [ WHO ] is User-A
			client.to(theOtherUser).emit("userJoined", client.id) // Notify User-A that User B has joined and [ WHO ] is User-B
		}
	})

	// Making possible - Handshake
	// User-A trying to call User-B by sending offer to User-B
	client.on('offer', (payload: any) => { // payload: {from: User-A, paylod: offerObject}
		io.to(payload.target).emit('offer', payload);
	})

	// User-B is answering to the call from User-A 
	client.on('answer', (payload: any) => {
		io.to(payload.target).emit('answer', payload); // payload {to: User-A, payload: answerObject}
	})

	// To bypass low level networking 
	// Both User-A and User-B need to determine their respective ICECandidate-Identity in order to complete the handshake for establishing communication
	// Both User-A and User-B will share (with each other) back and forth their respective ICECandidates
	// At some point of time, they will be able to come to a conclusion as which ICECandidates will makes sence for them
	// And then they can finish their handshake and have aproper connection
	client.on("iceCandidate", (incoming: any) => {
		io.to(incoming.target).emit("iceCandidate", incoming.candidate)
	})

	/* ****************** SIGNALING END ********************** */

    onUserDisconnect(client, clients, rooms);
});

app.use(cors({credentials: true, origin: 'http://localhost:3000'}));

server.listen(PORT, () =>
  console.log(`Example app listening on port ${PORT}!`)
);
