import ChangeOperation from "./ChangeOperation";

export default interface SetChangeOperation extends ChangeOperation {
    value: any;
}