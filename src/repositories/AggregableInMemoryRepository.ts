import { Service } from "typedi";
import { JSONSchema7 } from "json-schema";

import { FullAggregable } from "../models/aggregables";
import { ConsoleLogger } from "../utils";
import { Change, ProcessedChange } from "../models/aggregables/changes";

@Service()
export default class AggregableInMemoryRepository {
    counter: number;
    changeCounter: number;
    map: Map<string, FullAggregable> = new Map();
    
    constructor(
        readonly logger: ConsoleLogger
    ) {
        this.counter = 0;
        this.changeCounter = 0;
        this.map = new Map();
    }

    // Helpers

    #nextId(): string {
        const nextId: string = `${this.counter}`;
        this.counter += 1;
        return nextId;
    }

    #nextChangeId(): string {
        const nextId: string = `${this.changeCounter}`;
        this.changeCounter += 1;
        return nextId;
    }

    // Interfaces

    /**
     * Inserts an aggregable object
     * 
     * @param schema 
     * @param value 
     * @returns 
     */
    insert(createdBy: string, schema: JSONSchema7, value: any): FullAggregable {
        let ret: FullAggregable;

        // Create model
        const id: string = this.#nextId();
        const created: FullAggregable = {
            id,
            schema,
            value,
            initialValue: value,
            changes: [],
            subscribed: new Set<string>(),
            createdBy,
            createdAt: Date.now()
        };

        // Save model
        this.map.set(id, created);

        ret = created; // If no error

        return Object.assign({}, ret);
    }

    /**
     * Gets an aggregable based on its id
     * 
     * @param id 
     * @returns 
     */
    findById(id: string): FullAggregable | undefined {
        let ret: FullAggregable | undefined;

        ret = this.map.get(id);

        if (!ret) {
            ret = undefined;
        }

        return Object.assign({}, ret);
    }

    /**
     * Replaces an aggregable based on its id
     * 
     * @param id
     * @param newAggregable
     * @returns 
     */
    replaceById(id: string, newAggregable: FullAggregable): FullAggregable {
        const oldAggregable: FullAggregable | undefined = this.findById(id);

        if (!oldAggregable) {
            // Not found --> Error
            // TODO: error
            this.logger.error(`Aggregable with id '${id}' not found`);
            throw new Error();
        }

        this.map.set(id, newAggregable);

        return Object.assign({}, newAggregable);
    }

    /**
     * Replaces an aggregable based on its id
     * 
     * @param id
     * @param newAggregable
     * @returns 
     */
    replaceValueById(id: string, value: any): FullAggregable {
        const oldAggregable: FullAggregable | undefined = this.findById(id);

        if (!oldAggregable) {
            // Not found --> Error
            // TODO: error
            this.logger.error(`Aggregable with id '${id}' not found`);
            throw new Error();
        }

        oldAggregable.value = value;

        this.map.set(id, oldAggregable);

        return Object.assign({}, oldAggregable);
    }

    /**
     * Add change to an aggregable based on its id
     * 
     * @param id
     * @param change
     * @param changeBy
     * @returns 
     */
    addChangeToId(id: string, change: Change, changeBy: string): ProcessedChange {
        const agg: FullAggregable | undefined = this.findById(id);

        if (!agg) {
            // Not found --> Error
            // TODO: error
            this.logger.error(`Aggregable with id '${id}' not found`);
            throw new Error();
        }

        let processed: ProcessedChange = {
            ...change,
            changeId: this.#nextChangeId(),
            changeAt: Date.now(),
            changeBy
        }
        if (!agg.changes) {
            agg.changes = [];
        }
        agg.changes.push(processed);

        return processed;
    }

    /**
     * Add change to an aggregable based on its id
     * 
     * If changeId is given, it must be valid,
     * or 0 results will be found
     * 
     * @param id
     * @param change
     * @returns 
     */
    changesSince(id: string, changeId?: string, changeAt?: number): ProcessedChange[] {
        const agg: FullAggregable | undefined = this.findById(id);

        if (!agg) {
            // Not found --> Error
            // TODO: error
            this.logger.error(`Aggregable with id '${id}' not found`);
            throw new Error();
        }

        const changes: ProcessedChange[] = [];
        let append: boolean = false;
        for (let change of agg.changes) {
            console.log("Changes since for change:");
            console.log(change);
            if (
                append // We asume the changes are saved in order
                || (!changeId && !changeAt)
                || (!!changeId && !!changeAt && changeId === change.changeId && changeAt < change.changeAt)
                || (!!changeId && !changeAt && changeId === change.changeId)
                || (!changeId && !!changeAt && changeAt < change.changeAt)
            ) {
                append = true; // Ordered changes

                if (!!changeId && changeId === change.changeId) { // Then we add next one
                    continue;
                }

                console.log("adding change");
                changes.push(change);
            }
        }

        return changes;
    }
    

    /**
     * Removes an aggregable based on its id
     * 
     * @param id 
     */
    removeById(id: string): boolean {
        this.map.delete(id);

        return true; // Always works
    }
    
}