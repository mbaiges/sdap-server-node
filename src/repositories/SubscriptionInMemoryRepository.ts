import { Service } from "typedi";

import { User } from "../models/users";
import { Aggregable } from "../models/aggregables";
import { Subscription } from "../models/subscriptions";
import { ConsoleLogger } from "../utils";
import UserInMemoryRepository from "./UserInMemoryRepository";
import AggregableInMemoryRepository from "./AggregableInMemoryRepository";

@Service()
export default class SubscriptionInMemoryRepository {
    counter: number;
    map: Map<string, Subscription> = new Map();
    subscriptionsByUser: Map<string, Map<string, Subscription>> = new Map();
    subscriptionsByAgg:  Map<string, Map<string, Subscription>> = new Map();
    
    constructor(
        readonly logger: ConsoleLogger,
        readonly userRepository: UserInMemoryRepository,
        readonly aggRepository: AggregableInMemoryRepository
    ) {
        this.counter = 0;
        this.map = new Map();
        this.subscriptionsByUser = new Map();
        this.subscriptionsByAgg  = new Map();
    }

    // Helpers

    #nextId(): string {
        const nextId: string = `${this.counter}`;
        this.counter += 1;
        return nextId;
    }

    // Interfaces

    /**
     * Creates a subscription
     * 
     * @param userId
     * @param aggId 
     * @returns 
     */
    subscribe(userId: string, aggId: string): Subscription {
        let ret: Subscription;

        // Create model
        const id: string = this.#nextId();
        const created: Subscription = {
            id,
            userId,
            aggId
        };

        // Save model
        this.map.set(id, created);

        let userSubs : Map<string, Subscription> | undefined = this.subscriptionsByUser.get(userId);
        if (!userSubs) {
            userSubs = new Map();
        }
        userSubs.set(aggId, created);
        this.subscriptionsByUser.set(userId, userSubs);

        let aggSubs : Map<string, Subscription> | undefined = this.subscriptionsByAgg.get(aggId);
        if (!aggSubs) {
            aggSubs = new Map();
        }
        aggSubs.set(userId, created);
        this.subscriptionsByAgg.set(aggId, aggSubs);

        ret = created; // If no error

        return ret;
    }

    /**
     * Get users subscriptions
     * 
     * @param userId 
     * @returns 
     */
    findUserSubscriptions(userId: string): Aggregable[] {
        let ret: Aggregable[];

        const subs : Map<string, Subscription> | undefined = this.subscriptionsByUser.get(userId);

        ret = [];
        if (subs) {
            for (const sub of subs.values()) {
                const agg : Aggregable | undefined = this.aggRepository.findById(sub.aggId);
                if (agg) {
                    ret.push(agg);
                }
            }
        }

        return ret;
    }

    /**
     * Get aggregable subscriptions
     * 
     * @param aggId 
     * @returns 
     */
    findAggregableSubscriptions(aggId: string): User[] {
        let ret: User[];

        const subs : Map<string, Subscription> | undefined = this.subscriptionsByAgg.get(aggId);

        ret = [];
        if (subs) {
            for (const sub of subs.values()) {
                
                const user : User | undefined = this.userRepository.findById(sub.userId);
                if (user) {
                    ret.push(user);
                }
            }
        }

        return ret;
    }

    /**
     * Removes subscription
     * 
     * @param userId
     * @param aggId 
     */
    unsubscribe(userId: string, aggId: string): boolean {
        let s: Subscription | undefined = undefined;

        const mAgg: Map<string, Subscription> | undefined = this.subscriptionsByUser.get(userId);
        if (mAgg) {
            const s1: Subscription | undefined = mAgg.get(aggId);
            if (s1) {
                mAgg.delete(aggId);
                if (!s) {
                    s = s1;
                }
                if (mAgg.size === 0) {
                    this.subscriptionsByUser.delete(userId);
                }
            }
        }

        const mUser: Map<string, Subscription> | undefined = this.subscriptionsByAgg.get(aggId);
        if (mUser) {
            const s2: Subscription | undefined = mUser.get(userId);
            if (s2) {
                mUser.delete(userId);
                if (!s) {
                    s = s2;
                }
                if (mUser.size === 0) {
                    this.subscriptionsByAgg.delete(aggId);
                }
            }
        }

        if (s) {
            this.map.delete(s.id);
        }

        return true; // Always works
    }

    /**
     * Removes user subscription
     * 
     * @param userId 
     */
    unsubscribeUser(userId: string): boolean {
        const subs : Map<string, Subscription> | undefined = this.subscriptionsByUser.get(userId);

        if (subs) {
            for (const sub of subs.values()) {
                this.unsubscribe(userId, sub.aggId);
            }
        }

        return true; // Always works
    }

    /**
     * Removes aggregable subscription
     * 
     * @param aggId 
     */
    unsubscribeAggregable(aggId: string): boolean {
        const subs : Map<string, Subscription> | undefined = this.subscriptionsByAgg.get(aggId);

        if (subs) {
            for (const sub of subs.values()) {
                this.unsubscribe(sub.userId, aggId);
            }
        }

        return true; // Always works
    }
    
}