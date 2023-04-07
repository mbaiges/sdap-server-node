export class AggregableNameAlreadyExistsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AggregableNameAlreadyExistsError";
    }
}