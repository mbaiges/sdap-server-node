import { Change } from "../aggregables/changes";

import Message from "./Message";

export default interface UpdateRequestMessage extends Message {
    id:      string;
    updates: Change[];
}