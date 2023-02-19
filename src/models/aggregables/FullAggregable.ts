import { ProcessedChange } from "./changes";
import { Aggregable } from ".";

export default interface FullAggregable extends Aggregable {
    id:           string;
    initialValue: any;
    changes:      ProcessedChange[];
    subscribed:   Set<string>;
    createdAt:    number;
    createdBy:    string;
}