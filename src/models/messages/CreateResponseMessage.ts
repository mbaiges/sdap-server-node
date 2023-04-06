import Message from "./Message";

import { Aggregable } from "../../models/aggregables";

export default interface CreateResponseMessage extends Message {
    name?:    string;
    created?: Aggregable;
}