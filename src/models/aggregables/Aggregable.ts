import { JSONSchema7 } from "json-schema";

export default interface Aggregable {
    id:     string;
    schema: JSONSchema7;
    value:  any;
}