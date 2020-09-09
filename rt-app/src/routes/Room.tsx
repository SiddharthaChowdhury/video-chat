import React from "react";
import { UtilSocket } from '../util/utilSocket';

export const $io = new UtilSocket();

/*
    This is rendered when someone presses "Create room" button
    the current user will be redirected to a page with this component

    Consider -  Current user is User-A (initiator)
                Remote user is User-B
*/
export const Room: React.FC<any> = (props) => {
    const userVideo = React.useRef<any>();
    const remoteVideo = React.useRef<any>();

    const peerRef = React.useRef<any>();
    const otherUserRef = React.useRef<any>();
    const userStream = React.useRef<MediaStream>(); // will store the current user strem

    React.useEffect(() => {
        navigator.mediaDevices.getUserMedia({audio: true, video: true})
        .then((stream: MediaStream) => {
            userVideo.current.srcObject = stream;
            userStream.current = stream;

            // Push current user (User-A) to the chat room he just created

            $io.socket.emit('joinRoom', props.match.params.roomID); // Join current user to the current roomId from URL

            // Case for User-B
            // Lets say current user is User-B he is trying to joing the room while User-A is already in the room
            // In this case when User-B will join the room the following event will be trigger,
            // and he (User-B) will then receive the User-A id though this listener
            $io.socket.on('otherUser', (userA_ID: any) => {
                callUser(userA_ID);
                otherUserRef.current = userA_ID;
            })

            // Case for User-A
            // As the other user-B joins while User-A is already in the room
            // User-A will be notified that user-B has just joined the room
            $io.socket.on('userJoined', (userB_ID: any) => {
                otherUserRef.current = userB_ID;
            })

            // case User-B:
            // When we are receiveing a call
            $io.socket.on('offer', handleReceiveCall);

            // case User-A:
            // User-A as iniator have made and "offer" to User-B 
            // and through the following listener User-A will get the answer back from User-B as acknowledgement
            $io.socket.on('answer', handleAnswer);

            // handling ICEcandidate handshake process is common for both User-A and User-B
            $io.socket.on('iceCandidate', handleNewICEcandidateMsg);

        }).catch(error => {
            console.log(`Error: ${error.toString()}`)
        })
    }, []);

    // case User-B
    function callUser(userA_ID: any) {
        peerRef.current = createPeer(userA_ID); // WebRTC Peer Object

        // basically getTracks() is [trackAudio, trackVideo]
        // Say User-B is taking his stream add attaching to User-A, (kindof giving access of the stram to User-A to be able to see/hear) 
        // to have them both connected
        userStream.current?.getTracks().forEach(track => {
            peerRef.current.addTrack(track, userStream.current)
        })
    }

    // case User-B, User-A
    // userId represents the peer trying to call -> User-A calls it
    // if userId === undefined -> case User-B calls it
    function createPeer(userId?: any) {
        // const peer = new RTCPeerConnection({
        //     iceServers: [
        //         {
        //             urls: "stun:stun.stunprotocol.org"
        //         },
        //     ]
        // })
        const peer = new RTCPeerConnection();

        // whenever browser decides on send another ICEcandidate
        peer.onicecandidate = handleICEcandidateEvent;

        // Whenever we receive a remote/partner peer stream, this grabs the stream and displays on the screen
        peer.ontrack = handleTrackEvent;

        // "onnegotiationneeded" is listened when negotiation takes place
        // When  user-A initiates a call the "onnegotiationneeded" is fired
        // this is where the "offer" will get created and is sent to User-B 
        // then User-B then gets the "offer", creates an "answer" and sends it back
        // this is what will happen in "handleNegotiationNeededEvent()"
        peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userId);

        return peer;
    }

    // Case User-A:
    // Handler to make/initiate a call
    function handleNegotiationNeededEvent(userId: any) {
        peerRef.current.createOffer().then((offer: any) => {
            // As User-A is creating an offer -> thats why its localDescription else remoteDescriptuion
            return peerRef.current.setLocalDescription(offer);
        }).then(() => {
            const offerPayload = {
                target: userId, // user-B
                caller: $io.socket.id, // user A
                sdp: peerRef.current.localDescription
            };
            
            // make the offer/call
            $io.socket.emit('offer', offerPayload);
        }).catch((error: any) => console.log(`Failed handle negotiation while creating localDescription ${error.toString()}`));
    }

    // case User-B
    // handler to receive a call/offer
    function handleReceiveCall (incomingOffer: any) {
        peerRef.current = createPeer(); // we re not sending any offer so no need to pass any userId
        const desc = new RTCSessionDescription(incomingOffer.sdp); 

        peerRef.current.setRemoteDescription(desc)
        .then(() => { // as we re getting offer from remote (User-A) we create remoteDescription
            userStream.current?.getTracks().forEach(track => {
                peerRef.current.addTrack(track, userStream.current)
            });
        }).then(() => {
            return peerRef.current.createAnswer(); // this will resolve with and answer Object
        }).then((answer: any) => {
            return peerRef.current.setLocalDescription(answer);
        }).then(() => {
            const answerPayload = {
                target: incomingOffer.caller,
                caller: $io.socket.id,
                sdp: peerRef.current.localDescription
            };

            $io.socket.emit('answer', answerPayload);
        });
    }

    // case User-A:
    // handling ans back from User-B
    function handleAnswer(answerMessage: any) {
        const desc = new RTCSessionDescription(answerMessage.sdp);
        peerRef.current.setRemoteDescription(desc); // and this completes the handshake cycle
    }

    // case User-A, User-B
    // Both needs this to identify candidates
    function handleICEcandidateEvent(event: any) {
        if(event.candidate) {
            const payload = {
                target: otherUserRef.current,
                candidate: event.candidate
            }

            $io.socket.emit('iceCandidate', payload);
        }
    }

    // This event listener is internally called to generage new ICEcandidate for handshake purpose
    function handleNewICEcandidateMsg(incoming: any) {
        const candidate = new RTCIceCandidate(incoming);

        peerRef.current.addIceCandidate(candidate).catch((e: any) => console.log(`Failed! at handleNewICEcandidateMsg ${e.toString()}`))
    }

    function handleTrackEvent(event: any) {
        remoteVideo.current.srcObject = event.streams[0]
    }

    return (
        <div>
            <video autoPlay muted ref={userVideo}/>
            <video autoPlay muted ref={remoteVideo}/>
        </div>
    );
}