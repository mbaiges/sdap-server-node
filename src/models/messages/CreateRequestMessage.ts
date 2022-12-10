import Message from "./Message";

import { JSONSchema7 } from "json-schema";

export default interface CreateRequestMessage extends Message {
    schema: JSONSchema7;
    value:  any;
}