import React from 'react';
import Peer from 'simple-peer';
import './App.scss';
import { UtilSocket } from './util/utilSocket';
import { IdSocketKey } from './util/IdSocketKey';

export const $conn = new UtilSocket();

const App: React.FC<any> = () => {
	// const vidRef = React.createRef<any>();
	const client: any = {};

	const getVideoElement = (id: string, stream: any): HTMLVideoElement => {
		const video = document.createElement('video');
		video.id = id;
		video.srcObject = stream;
		
		video.setAttribute('class', 'video_comp');
		return video;
		// video.play()
	}

	navigator.mediaDevices.getUserMedia({video: true, audio: false})
	.then((stream: MediaStream) => {
		// // const {current} = vidRef;
		// const myVid: any = document.getElementById('my-video')!;
		// console.log('myVid', myVid)
		// // setAllowedDevices(true);
		const stamp = + new Date();

		const uid = stamp // window.prompt('Enter Login ID');
		const name = stamp // window.prompt('Enter name');
		$conn.socket.emit(IdSocketKey.ClientCanIjoin, {id: uid, name });

		// myVid.srcObj = stream;
		// myVid.play();

		//  Initialize user's video
		const myVid = getVideoElement('my-video', stream);

		myVid.play()
		document.getElementById('appContainer')!.appendChild(myVid);

		const InitPeer = (isInit: boolean) => {
			const peer = new Peer({
				initiator: isInit, 
				stream,
				trickle: false
			});
	
			peer.on('stream', function(stream: any) {
				const video = getVideoElement('peerVideo', stream);
				video.play()

				document.getElementById('appContainer')!.appendChild(video);
			});
	
			peer.on('close', function () {
				console.log('Peer closed app', peer);
				document.getElementById("peerVideo")!.remove();
				peer.destroy();
			})
	
			return peer;
		}

		//  ---------------------------------------------
		//				LISTEN TO SERVER Events
		//  ---------------------------------------------

		// SignIn to a video chat session
		$conn.socket.on(IdSocketKey.CreatePeer, () => {
			client.gotAnswer = false; // After sending offer we will wait for answer, so initialize it to false
			const peer = InitPeer(true);

			console.log('need to create peer')
	
			peer.on('signal', function(data) { // This will be called from "SignalAnswer()"
				if(!client.gotAnswer) {
						// Let others know that you are looking for another peer
					$conn.socket.emit('Offer', data) // TODO: This data is an Object, so remember to call JSON.stringify(data) to serialize it first
				}
			});
	
			client.peer = peer; // because the client has 2 properties, it has gotAnswer and peer
		})

		// this is when we got an offer from another client, and we want to give him an answer
		$conn.socket.on('BackOffer', (offer: any) => { 
			// so it will not be of type init = true
	
			const peer = InitPeer(false);
			peer.on('signal', (data) => { // this needs to be called 
				// TODO: This data is an Object, so remember to call JSON.stringify(data) to serialize it first
				$conn.socket.emit('Answer', data) // answering to the offer
			});
	
			peer.signal(offer);
		})

		// To establlish connection
		$conn.socket.on('BackAnswer', (answer: any) => {
			client.gotAnswer = true;
			const peer = client.peer;
			peer.signal(answer);
		})

		// When Server rejects user's login due to the limit of allowed peers in a active session
		$conn.socket.on(IdSocketKey.SessionFull, () => {
			// setSessionAvailable(false) 
			console.log('Session full')
		}); 

	})
	.catch((error) => {
		console.log('DENIED device', error)
		// setAllowedDevices(false)
	}) 


	console.log('peer rendered')

	return (
		<div className={'appContainer'} id={'appContainer'}>
			{/* {allowedDevices === undefined 
			? <h2>Please allow video and audio for video chat</h2>
			: allowedDevices === false
				? <h3>Access denied!</h3>
				: ( */}
					{/* <>
						<div className={'screenContainer'}>
							<video className={'user_me'} id={'my-video'}/>
						</div>
					</> */}
				{/* )
			} */}
			
		</div>
	);
}

export default App;
