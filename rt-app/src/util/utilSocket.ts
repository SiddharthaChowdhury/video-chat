import io from "socket.io-client";

export class UtilSocket {
    public socket: any = null;
    private SOCKET_URI = 'http://localhost:8000';

    constructor (){
        this.socket = io.connect(this.SOCKET_URI);
    }
}