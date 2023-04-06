export class AggregableNameAlreadyExists extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AggregableNameAlreadyExists";
    }
}