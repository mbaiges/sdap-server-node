import Message from "./Message";

import { Aggregable } from "../../models/aggregables";

export default interface CreateResponseMessage extends Message {
    created: Aggregable;
}