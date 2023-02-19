import { Change } from "../aggregables/changes";

import Message from "./Message";

export default interface UpdateRequestMessage extends Message {
    name:          string;
    updates:       Change[];
    lastChangeId?: string;
    force?:        boolean;
}