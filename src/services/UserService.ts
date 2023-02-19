import * as WebSocket from "ws";
import { Service } from "typedi";
import crypto from "crypto";

import { User } from "../models/users";
import { ConsoleLogger } from "../utils";
import { SubscriptionInMemoryRepository, UserInMemoryRepository } from "../repositories";

@Service()
export default class UserService {
    anonymousCounter: number;

    constructor(
        readonly logger: ConsoleLogger,
        readonly userRepository: UserInMemoryRepository,
        readonly subscriptionRepository: SubscriptionInMemoryRepository
    ) {
        this.anonymousCounter = 0;
    }

    #nextAnnonymousId(): string {
        const nextId: string = `${this.anonymousCounter}`;
        this.anonymousCounter += 1;
        return nextId;
    }

    /**
     * Creates an user
     * 
     * @param ws
     * @param username
     * @returns 
     */
    register(ws: WebSocket, username: string): User | undefined {
        if (username !== "anonymous") {
            return undefined; // Only support anonymous by now
        }

        const name: string = username + this.#nextAnnonymousId();

        if (this.userRepository.findByUsername(name)) {
            // throw new Error(); // Throw proper error
            return undefined;
        }

        // Repository
        const created: User = this.userRepository.insert(ws, name);

        return created;
    }

    /** 
     * Retrieves an user by id
     * 
     * @param id 
     * @returns 
     */
    findById(id: string): User | undefined {
        // Repository
        const user: User | undefined = this.userRepository.findById(id);

        return user;
    }

    /** 
     * Retrieves an user by username
     * 
     * @param username 
     * @returns 
     */
    findByUsername(username: string): User | undefined {
        // Repository
        const user: User | undefined = this.userRepository.findByUsername(username);

        return user;
    }

    /** 
     * Retrieves an user by ws
     * 
     * @param ws 
     * @returns 
     */
    findByWs(ws: WebSocket): User | undefined {
        // Repository
        const user: User | undefined = this.userRepository.findByWs(ws);

        return user;
    }

    /** 
     * delete an user by ws
     * 
     * @param ws 
     * @returns 
     */
    delete(ws: WebSocket): boolean {
        let res: boolean = true;
        
        const user: User | undefined = this.userRepository.findByWs(ws);
        if (!user) {
            // Nothing to do if user doesn't exist
            return true;
        }

        // Repository
        res = res && this.subscriptionRepository.unsubscribeUser(user.id)
        res = res && this.userRepository.removeByWs(ws);

        return res;
    }

}