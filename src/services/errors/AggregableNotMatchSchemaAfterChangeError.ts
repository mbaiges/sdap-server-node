export class AggregableNotMatchSchemaAfterChangeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AggregableNotMatchSchemaAfterChangeError";
    }
}