import Message from "./Message";

export default interface SubscribeResponseMessage extends Message {
    id:                   string;
    lastChangeId?:        string;
    lastChangeAt?:        number;
    compactPeriodically?: boolean;
    success:              boolean;
}