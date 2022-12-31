import Message from "./Message";

export default interface UnsubscribeResponseMessage extends Message {
    id:      string;
    success: boolean;
}