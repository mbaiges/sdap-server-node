import Message from "./Message";

import { ChangeResult } from "../../models/aggregables/changes";

export default interface UpdateResponseMessage extends Message {
    name:     string;
    results?: ChangeResult[];
}