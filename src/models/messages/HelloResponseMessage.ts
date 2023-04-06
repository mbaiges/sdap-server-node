import Message from "./Message";

export default interface HelloRequestMessage extends Message {
    username:     string;
    newUsername?: string;
}