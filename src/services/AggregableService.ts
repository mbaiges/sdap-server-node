import { Service } from "typedi";
import { JSONSchema7 } from "json-schema";
import * as JsonPointerUtils from "json-pointer";

import { User } from "../models/users";
import { Aggregable, FullAggregable } from "../models/aggregables";
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
    create(user: User, schema: JSONSchema7, value: any): Aggregable {
        // Repository
        const created: Aggregable = this.aggregableRepository.insert(user.id, schema, value);

        return created;
    }

    /////////////
    //   Get   //
    /////////////

    /** 
     * Retrieves the value of the given id
     * 
     * @param id 
     * @returns 
     */
    getById(user: User, id: string): Aggregable | undefined {
        // Repository
        const agg: Aggregable | undefined = this.aggregableRepository.findById(id);

        return agg;
    }

    ////////////////
    //   Schema   //
    ////////////////

    /** 
     * Retrieves the schema of the given id
     * 
     * @param user
     * @param id 
     * @returns 
     */
    schema(user: User, id: string): JSONSchema7 | undefined {
        // Repository
        const agg: Aggregable | undefined = this.aggregableRepository.findById(id);

        return agg? agg.schema : undefined;
    }

    ////////////////
    //   Update   //
    ////////////////

    /** 
     * Updates the object with defined changes. 
     * 
     * @param user
     * @param id
     * @param updates
     * @returns 
     */
    update(user: User, id: string, updates: Change[]): any[] {
        // Repository
        const agg: FullAggregable | undefined = this.aggregableRepository.findById(id);

        if (!agg) {
            // TODO: No Aggregable found
            throw new Error(`No Aggregable found with id '${id}'`);
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

                let result: any; // TODO: define proper type
                if (knownOp) {
                    const processed: ProcessedChange = this.aggregableRepository.addChangeToId(id, update, user.id);
                    processedChanges.push(processed);
                    result = {
                        success:    true,
                        changeId:   processed.changeId,
                        changeTime: processed.changeTime
                    }
                } else {
                    // In case unknown op - Add corresponding result
                    result = {
                        success: false,
                        error:   "unknownOp"
                    }
                }

                // If everything went right
                // Save change
                updateResults.push(result);
            }
        }

        this.aggregableRepository.replaceById(id, agg);

        return [updateResults, processedChanges];
    }

}