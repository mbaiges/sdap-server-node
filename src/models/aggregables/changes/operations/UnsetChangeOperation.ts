import ChangeOperation from "./ChangeOperation";

export default interface UnsetChangeOperation extends ChangeOperation {
    value: any;
}