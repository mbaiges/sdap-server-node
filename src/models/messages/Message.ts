import { ErrorCovered } from "../errors";
import MessageType from "./MessageType";

export default interface Message extends ErrorCovered {
    type: MessageType;
    status?: number;
}