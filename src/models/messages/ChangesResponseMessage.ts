import Message from "./Message";

import { ProcessedChange } from "../aggregables/changes";

export default interface UpdateResponseMessage extends Message {
    id:      string;
    changes: ProcessedChange[];
}