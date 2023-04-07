export class AggregableNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AggregableNotFoundError";
    }
}