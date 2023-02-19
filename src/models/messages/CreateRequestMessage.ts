import Message from "./Message";

import { JSONSchema7 } from "json-schema";

export default interface CreateRequestMessage extends Message {
    name?:  string;
    schema: JSONSchema7;
    value:  any;
}