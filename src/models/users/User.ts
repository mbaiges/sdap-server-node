import * as WebSocket from "ws";

export default interface User {
    id:        string;
    username:  string;
    ws:        WebSocket;
    createdAt: number;
}