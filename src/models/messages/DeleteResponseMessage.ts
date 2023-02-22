import Message from "./Message";

export default interface CreateResponseMessage extends Message {
    name?:   string;
    success: boolean;
}