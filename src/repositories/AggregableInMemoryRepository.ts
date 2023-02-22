import { Service } from "typedi";
import { JSONSchema7 } from "json-schema";
import crypto from "crypto";

import { FullAggregable } from "../models/aggregables";
import { ConsoleLogger } from "../utils";
import { Change, ProcessedChange } from "../models/aggregables/changes";

const GEN_ID_LENGTH        = 16;
const GEN_CHANGE_ID_LENGTH = 16;
const GEN_NAME_LENGTH      = 16;

@Service()
export default class AggregableInMemoryRepository {
    map: Map<string, FullAggregable> = new Map();
    mapByName: Map<string, FullAggregable> = new Map();
    
    constructor(
        readonly logger: ConsoleLogger
    ) {
        this.map = new Map();
        this.mapByName = new Map();
    }

    // Helpers

    #nextId(): string {
        return crypto.randomBytes(GEN_ID_LENGTH).toString("hex");
    }

    #nextChangeId(): string {
        return crypto.randomBytes(GEN_CHANGE_ID_LENGTH).toString("hex");
    }

    #nextName(): string {
        return crypto.randomBytes(GEN_NAME_LENGTH).toString("hex");
    }

    // Interfaces

    /**
     * Inserts an aggregable object
     * 
     * @param schema 
     * @param value 
     * @returns 
     */
    insert(name: string | undefined, createdBy: string, schema: JSONSchema7, value: any): FullAggregable {
        let ret: FullAggregable;

        if (!name) {
            name = this.#nextName();
        }

        // Create model
        const id: string = this.#nextId();
        const created: FullAggregable = {
            id,
            name,
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
        this.mapByName.set(name, created);

        ret = created; // If no error

        return JSON.parse(JSON.stringify(ret));
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

        return JSON.parse(JSON.stringify(ret));
    }

    /**
     * Gets an aggregable based on its name
     * 
     * @param name 
     * @returns 
     */
    findByName(name: string): FullAggregable | undefined {
        let ret: FullAggregable | undefined;

        ret = this.mapByName.get(name);

        if (!ret) {
            ret = undefined;
        }

        return JSON.parse(JSON.stringify(ret));
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
        this.mapByName.set(oldAggregable.name, newAggregable);

        return JSON.parse(JSON.stringify(newAggregable));
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
        this.mapByName.set(oldAggregable.name, oldAggregable);

        return JSON.parse(JSON.stringify(oldAggregable));
    }

    /**
     * Add change to an aggregable based on its id
     * 
     * @param id
     * @param change
     * @param changeBy
     * @returns 
     */
    addChangeById(id: string, change: Change, changeBy: string): ProcessedChange {
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
    changesSinceById(id: string, changeId?: string, changeAt?: number): ProcessedChange[] {
        const agg: FullAggregable | undefined = this.findById(id);

        if (!agg) {
            // Not found --> Error
            // TODO: error
            this.logger.error(`Aggregable with id '${id}' not found`);
            throw new Error();
        }

        const changes: ProcessedChange[] = [];
        let append: boolean = false;

        if (agg.changes) {
            for (let change of agg.changes) {
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
                    
                    changes.push(change);
                }
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
        const agg: FullAggregable | undefined = this.findById(id);

        if (agg) {
            this.map.delete(id);
            this.mapByName.delete(agg.name);
        } else {
            // Nothing to do
        }

        return true; // Always works
    }
    
}