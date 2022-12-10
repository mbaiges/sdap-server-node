import { JSONSchema7 } from "json-schema";

import Message from "./Message";

export default interface SchemaResponseMessage extends Message {
    id:     string;
    schema: JSONSchema7;
}