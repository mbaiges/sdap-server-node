import Message from "./Message";

export default interface SubscribeResponseMessage extends Message {
    name:                 string;
    lastChangeId?:        string;
    lastChangeAt?:        number;
    compactPeriodically?: boolean;
}