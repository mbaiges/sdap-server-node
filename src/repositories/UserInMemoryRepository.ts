import * as WebSocket from "ws";
import { Service } from "typedi";

import { User } from "../models/users";
import { ConsoleLogger } from "../utils";

@Service()
export default class UserInMemoryRepository {
    counter:       number;
    mapByWs:       Map<WebSocket, User> = new Map();
    mapById:       Map<string, User> = new Map();
    mapByUsername: Map<string, User> = new Map();
    
    constructor(
        readonly logger: ConsoleLogger
    ) {
        this.counter = 0;
        this.mapByWs = new Map();
        this.mapById = new Map();
    }

    // Helpers

    #nextId(): string {
        const nextId: string = `${this.counter}`;
        this.counter += 1;
        return nextId;
    }

    // Interfaces

    /**
     * Inserts an user object
     * 
     * @param ws 
     * @returns 
     */
    insert(ws: WebSocket, username: string): User {
        let ret: User;

        // Create model
        const id: string = this.#nextId();
        const created: User = {
            id,
            username,
            ws,
            createdAt: Date.now()
        };

        // Save model
        this.mapByWs.set(ws, created);
        this.mapById.set(id, created);
        this.mapByUsername.set(username, created);

        ret = created; // If no error

        return ret;
    }

    /**
     * Gets an user based on its id
     * 
     * @param id 
     * @returns 
     */
    findById(id: string): User | undefined {
        let ret: User | undefined;

        ret = this.mapById.get(id);

        if (!ret) {
            ret = undefined;
        }

        return ret;
    }

    /**
     * Gets an user based on its username
     * 
     * @param username 
     * @returns 
     */
    findByUsername(username: string): User | undefined {
        let ret: User | undefined;

        ret = this.mapByUsername.get(username);

        if (!ret) {
            ret = undefined;
        }

        return ret;
    }

    /**
     * Gets an user based on its ws
     * 
     * @param ws 
     * @returns 
     */
    findByWs(ws: WebSocket): User | undefined {
        let ret: User | undefined;

        ret = this.mapByWs.get(ws);

        if (!ret) {
            ret = undefined;
        }

        return ret;
    }

    /**
     * Removes an user based on its ws
     * 
     * @param ws 
     */
    removeByWs(ws: WebSocket): boolean {
        const user : User | undefined = this.findByWs(ws);

        this.#remove(user);

        return true; // Always works
    }

    #remove(user: User | undefined): void {
        if (user) {
            this.mapById.delete(user.id);
            this.mapByWs.delete(user.ws);
            this.mapByUsername.delete(user.username);
        }
    }
    
}