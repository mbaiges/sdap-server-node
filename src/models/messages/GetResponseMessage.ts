import Message from "./Message";

export default interface GetResponseMessage extends Message {
    name:          string;
    value:         any;
    lastChangeId?: string;
    lastChangeAt?: number;
}