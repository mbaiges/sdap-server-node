import Message from "./Message";

export default interface GetResponseMessage extends Message {
    value: any;
}