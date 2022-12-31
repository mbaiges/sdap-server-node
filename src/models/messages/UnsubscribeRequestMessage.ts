import Message from "./Message";

export default interface UnsubscribeRequestMessage extends Message {
    id: string;
}