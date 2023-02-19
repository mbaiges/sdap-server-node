import { JSONSchema7 } from "json-schema";

export default interface Aggregable {
    name:   string;
    schema: JSONSchema7;
    value:  any;
}