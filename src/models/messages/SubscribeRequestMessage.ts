import Message from "./Message";

export default interface SubscribeRequestMessage extends Message {
    name:                 string;
    lastChangeId?:        string;
    lastChangeAt?:        number;
    compactPeriodically?: boolean;
}