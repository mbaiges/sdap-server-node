export class UnsupportedMessageTypeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UnsupportedMessageTypeError";
    }
}