export class AggregableNotFound extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AggregableNotFound";
    }
}