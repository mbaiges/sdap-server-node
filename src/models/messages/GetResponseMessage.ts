import Message from "./Message";

export default interface GetResponseMessage extends Message {
    id:              string;
    value:           any;
    lastChangeId?:   string;
    lastChangeTime?: number;
}