import Message from "./Message";

export default interface SubscribeRequestMessage extends Message {
    id:                   string;
    lastChangeId?:        string;
    lastChangeTime?:      number;
    compactPeriodically?: boolean;
}