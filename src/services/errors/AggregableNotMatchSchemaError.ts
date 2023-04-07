export class AggregableNotMatchSchemaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AggregableNotMatchSchemaError";
    }
}