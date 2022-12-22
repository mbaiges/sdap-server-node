import { Service } from "typedi";
import { JSONSchema7 } from "json-schema";
import * as JsonPointerUtils from "json-pointer";

import { Aggregable } from "../models/aggregables";
import { Change, ChangeOps, ChangeResult } from "../models/aggregables/changes";
import { ChangeOperation, ChangeOperationType, SetChangeOperation } from "../models/aggregables/changes/operations";
import { ConsoleLogger } from "../utils";
import { AggregableInMemoryRepository } from "../repositories";

@Service()
export default class AggregableService {
    constructor(
        readonly logger: ConsoleLogger,
        readonly aggregableRepository: AggregableInMemoryRepository
    ) {}

    ////////////////
    //   Create   //
    ////////////////

    /**
     * Creates an aggregable object with a defined schema
     * 
     * @param schema 
     * @param value 
     * @returns 
     */
    create(schema: JSONSchema7, value: any): Aggregable {
        // Repository
        const created: Aggregable = this.aggregableRepository.insert(schema, value);

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
    getById(id: string): Aggregable | undefined {
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
     * @param id 
     * @returns 
     */
    getSchema(id: string): JSONSchema7 | undefined {
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
     * @param id
     * @param updates
     * @returns 
     */
    update(id: string, updates: Change[]): ChangeResult[] {
        // Repository
        const agg: Aggregable | undefined = this.aggregableRepository.findById(id);

        if (!agg) {
            // TODO: No Aggregable found
            throw new Error(`No Aggregable found with id '${id}'`);
        }

        // Apply changes
        const updateResults: ChangeResult[] = []; 

        for (const update of updates) {
            const ops: ChangeOps = update.ops;
            for (const ptr in ops) {
                const op: ChangeOperation = ops[ptr];

                switch (op.type) {
                    case ChangeOperationType.Set:
                        const setOp: SetChangeOperation = op as SetChangeOperation;
                        let node = agg.value;
                        JsonPointerUtils.set(node, ptr, setOp.value);
                        break;
                }

                // If everything went right
                // Save change
                updateResults.push({
                    "success": true // TODO: Return new changeId
                });
            }
        }

        this.aggregableRepository.replaceById(id, agg);

        return updateResults;
    }

}