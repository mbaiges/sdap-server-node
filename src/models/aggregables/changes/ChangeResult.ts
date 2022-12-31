import { ErrorCovered } from "../../errors";

export default interface ChangeResult extends ErrorCovered {
    success:   boolean,
    changeId?: string,
    changeAt?: number,
}