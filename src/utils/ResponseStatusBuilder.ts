import { Service } from "typedi";

import { 
    Message
} from "../models/messages";
import { AggregableNameAlreadyExists, AggregableNotFound } from "../repositories/errors";
import * as Errors from "../models/errors";
import { StatusCode } from "../models/status";

function appendErrors(resp: Message, errors: Errors.Error[]) {
    if (!resp.errors) {
        resp.errors = [];
    }
    if (errors) {
        errors.forEach(e => resp.errors?.push(e));
    }
}

@Service()
export default class ResponseStatusBuilder {

    processErrors(resp: Message, error: any) {
        // Response
        if (error instanceof AggregableNameAlreadyExists) {
            resp.status = StatusCode.CONFLICT.code;
            if (!resp.errors) {
                resp.errors = [];
            }
            resp.errors.push({
                code: Errors.ErrorCode.AGGREGABLE_NAME_EXISTS.code,
                msg:  error.message
            });
        } else if (error instanceof AggregableNotFound) {
            resp.status = StatusCode.NOT_FOUND.code;
            appendErrors(resp, [
                {
                    code: Errors.ErrorCode.AGGREGABLE_NOT_FOUND.code,
                    msg:  error.message
                }
            ]);
        } else {
            resp.status = StatusCode.INTERNAL_SERVER_ERROR.code;
            appendErrors(resp, [
                {
                    code: Errors.ErrorCode.INTERNAL_SERVER_ERROR.code,
                    msg:  "" + error
                }
            ]);
        }
    }
}