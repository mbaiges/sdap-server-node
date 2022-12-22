import Message from "./Message";

export default interface ChangesRequestMessage extends Message {
    id:                   string;
    lastChangeId?:        string;
    lastChangeTime?:      number;
    compactPeriodically?: boolean;
}