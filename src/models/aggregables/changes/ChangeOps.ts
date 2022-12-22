import { ChangeOperation } from "./operations";

export default interface ChangeOps {
    [key: string]: ChangeOperation;
}