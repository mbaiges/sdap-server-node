import Message from "./Message";

export default interface GetRequestMessage extends Message {
    id: string;
}