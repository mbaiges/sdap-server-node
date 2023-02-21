import { Service } from "typedi";
import { JSONSchema7 } from "json-schema";
import * as JsonPointerUtils from "json-pointer";

import { User } from "../models/users";
import { Error } from "../models/errors";
import { FullAggregable } from "../models/aggregables";
import { Change, ChangeOps, ChangeResult, ProcessedChange } from "../models/aggregables/changes";
import { ChangeOperation, ChangeOperationType, SetChangeOperation } from "../models/aggregables/changes/operations";
import { ConsoleLogger } from "../utils";
import { AggregableInMemoryRepository } from "../repositories";
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
     * @param schema 
     * @param value 
     * @returns 
     */
    create(name: string | undefined, user: User, schema: JSONSchema7, value: any): FullAggregable {
        // Repository
        const created: FullAggregable = this.aggregableRepository.insert(name, user.id, schema, value);

        return created;
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
    findByName(user: User, name: string): FullAggregable | undefined {
        // Repository
        const agg: FullAggregable | undefined = this.aggregableRepository.findByName(name);

        return agg;
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
    schema(user: User, name: string): JSONSchema7 | undefined {
        // Repository
        const agg: FullAggregable | undefined = this.aggregableRepository.findByName(name);

        return agg? agg.schema : undefined;
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
        const agg: FullAggregable | undefined = this.aggregableRepository.findByName(name);

        if (!agg) {
            // TODO: No Aggregable found
            throw new Error(`Aggregable with name '${name}' not found`);
        }

        // Apply changes
        const processedChanges: ProcessedChange[] = [];
        const updateResults: ChangeResult[] = []; 

        for (const update of updates) {
            const ops: ChangeOps = update.ops;
            for (const ptr in ops) {
                const op: ChangeOperation = ops[ptr];

                let node = Object.assign({}, agg.value);

                let knownOp: boolean = true;
                switch (op.type) {
                    case ChangeOperationType.Set:
                        const setOp: SetChangeOperation = op as SetChangeOperation;
                        JsonPointerUtils.set(node, ptr, setOp.value);
                        break;
                    default:
                        knownOp = false;
                        break;
                }

                let result: ChangeResult; // TODO: define proper type
                if (knownOp) {
                    const processed: ProcessedChange = this.aggregableRepository.addChangeById(agg.id, update, user.id);
                    processedChanges.push(processed);
                    result = {
                        success:  true,
                        changeId: processed.changeId,
                        changeAt: processed.changeAt
                    }
                } else {
                    // In case unknown op - Add corresponding result
                    result = {
                        success: false,
                        errors:  [
                            {
                                code: "unknownOp",
                                msg:  "Unknown Operation"
                            }
                        ]
                    }
                }

                // If everything went right
                // Save change
                updateResults.push(result);
            }
        }

        this.aggregableRepository.replaceById(agg.id, agg);

        return [updateResults, processedChanges];
    }

}