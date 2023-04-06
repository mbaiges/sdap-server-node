import { Service } from "typedi";
import { JSONSchema7 } from "json-schema";
import * as JsonPointerUtils from "json-pointer";

import { User } from "../models/users";
import { FullAggregable } from "../models/aggregables";
import { Change, ChangeOps, ChangeResult, ProcessedChange } from "../models/aggregables/changes";
import { 
    ChangeOperation, 
    ChangeOperationType, 
    SetChangeOperation,
    UnsetChangeOperation,
    NumAddChangeOperation,
    ArrAppendChangeOperation
} from "../models/aggregables/changes/operations";
import { ConsoleLogger } from "../utils";
import { AggregableInMemoryRepository } from "../repositories";
import { AggregableNameAlreadyExists } from "../repositories/errors";
import SubscriptionService from "./SubscriptionService";

@Service()
export default class AggregableService {
    constructor(
        readonly logger: ConsoleLogger,
        readonly aggregableRepository: AggregableInMemoryRepository,
        readonly subscriptionService: SubscriptionService
    ) {}

    ////////////////
    //   Create   //
    ////////////////

    /**
     * Creates an aggregable object with a defined schema
     * 
     * @param user
     * @param name
     * @param schema 
     * @param value 
     * @returns 
     */
    create(user: User, name: string | undefined, schema: JSONSchema7, value: any): FullAggregable {
        // Repository
        try {
            const created: FullAggregable = this.aggregableRepository.insert(name, user.username, schema, value);
            return created;
        } catch (error) {
            if (error instanceof AggregableNameAlreadyExists) {
                throw error; // propagate this error
            } else {
                throw error;
            }
        }
    }

    ////////////////
    //   Delete   //
    ////////////////

    /**
     * Deletes an aggregable object with a defined schema
     * 
     * @param user
     * @param name
     * @returns 
     */
    delete(user: User, name: string): boolean {
        // Repository
        const agg: FullAggregable | undefined = this.aggregableRepository.findByName(name);

        let ret = true;

        if (agg) {
            console.log(agg);
            if (agg.createdBy == user.username) {
                // Repository
                ret = this.aggregableRepository.removeById(agg.id);
            } else {
                // TODO: Insufficient permissions (not the owner)
                throw new Error(`Aggregable with name '${name}' not owned by requesting user`);
            }
        } else {
            // No Aggregable found
            // throw new Error(`Aggregable with name '${name}' not found`);
        }

        return ret;
    }

    /////////////
    //   Get   //
    /////////////

    /** 
     * Retrieves the value of the given name
     * 
     * @param user
     * @param name 
     * @returns 
     */
    findByName(user: User, name: string): FullAggregable {
        try {
            // Repository
            const agg: FullAggregable = this.aggregableRepository.findByName(name);
            console.log(agg);
            return agg;
        } catch (error) {
            if (error instanceof AggregableNameAlreadyExists) {
                throw error; // propagate this error
            } else {
                throw error;
            }
        }
    }

    ////////////////
    //   Schema   //
    ////////////////

    /** 
     * Retrieves the schema of the given name
     * 
     * @param user
     * @param name 
     * @returns 
     */
    schema(user: User, name: string): JSONSchema7 {
        try {
            // Repository
            const agg: FullAggregable = this.aggregableRepository.findByName(name);
            return agg.schema;
        } catch (error) {
            if (error instanceof AggregableNameAlreadyExists) {
                throw error; // propagate this error
            } else {
                throw error;
            }
        }
    }

    ////////////////
    //   Update   //
    ////////////////

    /** 
     * Updates the object with defined changes. 
     * 
     * @param user
     * @param name
     * @param updates
     * @returns 
     */
    update(user: User, name: string, updates: Change[]): any[] {
        // Repository
        let agg: FullAggregable;
        try {
            agg = this.aggregableRepository.findByName(name);
        } catch (error) {
            throw error; // Propagate when error
        }

        // Apply changes
        const processedChanges: ProcessedChange[] = [];
        const updateResults: ChangeResult[] = []; 

        for (const update of updates) {
            const ops: ChangeOps = update.ops;

            let node = agg.value; // It's always a copy

            let errors: any = []
            for (const ptr in ops) {
                const op: ChangeOperation = ops[ptr];

                let knownOp: boolean = true;
                switch (op.type) {
                    case ChangeOperationType.Set:
                        const setOp: SetChangeOperation = op as SetChangeOperation;
                        if ("/" === ptr) { // TODO: If ends with "/", replace the value
                            node = setOp.value;
                        } else {
                            JsonPointerUtils.set(node, ptr, setOp.value);
                        }
                        break;
                    case ChangeOperationType.Unset:
                        const unsetOp: UnsetChangeOperation = op as UnsetChangeOperation;
                        if ("/" === ptr) { // TODO: If ends with "/", replace the value
                            node = undefined;
                        } else {
                            JsonPointerUtils.set(node, ptr, undefined);
                        }
                        break;
                    case ChangeOperationType.NumAdd:
                        const numAddOp: NumAddChangeOperation = op as NumAddChangeOperation;
                        let numToAdd = JsonPointerUtils.get(node, ptr);
                        if ("/" === ptr) { // TODO: If ends with "/", replace the value
                            node = numToAdd + numAddOp.value;
                        } else {
                            JsonPointerUtils.set(node, ptr, numToAdd + numAddOp.value);
                        }
                        break;
                    case ChangeOperationType.ArrAppend:
                        const arrAppendOp: ArrAppendChangeOperation = op as ArrAppendChangeOperation;
                        let arrToAppendTo;
                        if ("/" === ptr) { // TODO: If ends with "/", replace the value
                            arrToAppendTo = node;
                            arrToAppendTo.push(arrAppendOp.value);
                        } else {
                            arrToAppendTo = JsonPointerUtils.get(node, ptr);
                            arrToAppendTo.push(arrAppendOp.value);
                            JsonPointerUtils.set(node, ptr, arrToAppendTo);
                        }
                        break;
                    default:
                        knownOp = false;
                        break;
                }
                
                if (!knownOp) {
                    errors.push({
                        code: "unknownOp",
                        msg:  `Unknown operation '${op.type}' at pointer '${ptr}'`
                    })
                }
            }

            let result: ChangeResult; // TODO: define proper type
            if (!errors || errors.length == 0) {
                // If everything went right
                // Save change with all its operations
                this.aggregableRepository.replaceValueById(agg.id, node);

                const processed: ProcessedChange = this.aggregableRepository.addChangeById(agg.id, update, user.username);
                processedChanges.push(processed);
                result = {
                    success:  true,
                    changeId: processed.changeId,
                    changeAt: processed.changeAt
                }
            } else {
                result = {
                    success: false,
                    errors:  errors
                }
            }

            updateResults.push(result);
        }

        return [updateResults, processedChanges];
    }

}