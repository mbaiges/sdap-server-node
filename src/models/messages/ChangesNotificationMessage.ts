import Message from "./Message";

import { ProcessedChange } from "../aggregables/changes";

export default interface ChangesNotificationMessage extends Message {
    name:    string;
    changes: ProcessedChange[];
}