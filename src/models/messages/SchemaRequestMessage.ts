import Message from "./Message";

export default interface SchemaRequestMessage extends Message {
    name: string;
}