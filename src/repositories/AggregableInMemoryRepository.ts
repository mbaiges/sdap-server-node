import { Service } from "typedi";
import { JSONSchema7 } from "json-schema";

import { Aggregable } from "../models/aggregables";
import { ConsoleLogger } from "../utils";

@Service()
export default class AggregableInMemoryRepository {
    counter: number;
    map: any = {};
    
    constructor(
        readonly logger: ConsoleLogger
    ) {
        this.counter = 0;
        this.map = {};
    }

    // Helpers

    #nextId(): string {
        const nextId: string = `${this.counter}`;
        this.counter += 1;
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
    insert(schema: JSONSchema7, value: any): Aggregable {
        let ret: Aggregable;

        // Create model
        const id: string = this.#nextId();
        const created: Aggregable = {
            id,
            schema,
            value
        };

        // Save model
        this.map[id] = created;

        ret = created; // If no error

        return ret;
    }

    /**
     * Gets an aggregable based on its id
     * 
     * @param id 
     * @returns 
     */
    findById(id: string): Aggregable | undefined {
        let ret: Aggregable | undefined;

        ret = this.map[id];

        if (!ret) {
            ret = undefined;
        }

        return ret;
    }

    /**
     * Replaces an aggregable based on its id
     * 
     * @param id
     * @param newAggregable
     * @returns 
     */
    replaceById(id: string, newAggregable: Aggregable): Aggregable {
        const oldAggregable: Aggregable | undefined = this.findById(id);

        if (!oldAggregable) {
            // Not found --> Error
            // TODO: error
            this.logger.error(`Aggregable with id '${id}' not found`);
            throw new Error();
        }

        this.map[id] = newAggregable;

        return newAggregable;
    }


    /**
     * Removes an aggregable based on its id
     * 
     * @param id 
     */
    removeById(id: string): boolean {
        delete this.map[id];

        return true; // Always works
    }
    
}