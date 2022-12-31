import Message from "./Message";

import { Aggregable } from "../../models/aggregables";

export default interface CreateResponseMessage extends Message {
    id:      string;
    created: Aggregable;
}