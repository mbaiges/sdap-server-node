import { Service } from "typedi";

import { User } from "../models/users";
import { FullAggregable } from "../models/aggregables";
import { Subscription } from "../models/subscriptions";
import { ProcessedChange } from "../models/aggregables/changes";
import { ChangesNotificationMessage, MessageType } from "../models/messages";
import { ConsoleLogger } from "../utils";
import { AggregableInMemoryRepository, SubscriptionInMemoryRepository, UserInMemoryRepository } from "../repositories";

@Service()
export default class SubscriptionService {
    constructor(
        readonly logger: ConsoleLogger,
        readonly userRepository: UserInMemoryRepository,
        readonly aggregableRepository: AggregableInMemoryRepository,
        readonly subscriptionRepository: SubscriptionInMemoryRepository
    ) {}

    /**
     * Subscribes an user to an aggregable
     * 
     * @param user
     * @param aggName
     * @returns 
     */
    subscribe(user: User, aggName: string): boolean {
        let res: boolean = true;

        const agg: FullAggregable | undefined = this.aggregableRepository.findByName(aggName);
        if (!agg) {
            // TODO: Throw corresponding error
            throw new Error(`No aggregable with name ${aggName} found`);
        }

        const sub: Subscription = this.subscriptionRepository.subscribe(user.id, agg.id);
        res = sub && sub.userId === user.id && sub.aggId === agg.id;

        return res;
    }

    /**
     * Unsubscribes an user to an aggregable
     * 
     * @param user
     * @param aggName
     * @returns 
     */
    unsubscribe(user: User, aggName: string): boolean {
        let res: boolean = true;

        const agg: FullAggregable | undefined = this.aggregableRepository.findByName(aggName);
        if (!agg) {
            // TODO: Throw corresponding error
            throw new Error(`No aggregable with name ${aggName} found`);
        }

        res = this.subscriptionRepository.unsubscribe(user.id, agg.id);

        return res;
    }

    /**
     * Notify given users about changes under aggregable with given name
     * 
     * @param aggName
     * @returns 
     */
    notifyChangesToUsers(users: User[], aggName: string, changes: ProcessedChange[]): void {
        if (!users || users.length === 0) {
            // Nothing to notify
            return;
        }

        for (const user of users) {
            // Filter own changes
            const othersChanges = [];
            for (let change of changes) {
                if (user.id !== change.changeBy) {
                    othersChanges.push(change);
                }
            }

            if (othersChanges.length === 0) {
                continue;
            }

            const msg: ChangesNotificationMessage = {
                type: MessageType.Changes,
                name: aggName,
                changes: othersChanges
            }

            user.ws.send(JSON.stringify(msg));
        }
    }

    /**
     * Notify subscribed users about changes under aggregable with given name
     * 
     * @param aggName
     * @returns 
     */
    notifyChanges(aggName: string, changes: ProcessedChange[]): void {
        if (changes.length === 0) {
            return;
        }

        const agg: FullAggregable | undefined = this.aggregableRepository.findByName(aggName);
        if (!agg) {
            // No agg with that id found
            return;
        }

        const users: User[] = this.subscriptionRepository.findAggregableSubscriptions(agg.id);

        this.notifyChangesToUsers(users, aggName, changes);
    }

    /**
     * Notify users about changes under aggregable with given name
     * 
     * @param user
     * @param aggName
     * @returns 
     */
    notifyChangesSince(users: User[], aggName: string, changeId?: string, changeTime?: number): void {
        const agg: FullAggregable | undefined = this.aggregableRepository.findByName(aggName);
        if (!agg) {
            // No agg with that id found
            return;
        }

        const changes: ProcessedChange[] = this.aggregableRepository.changesSinceById(agg.id, changeId, changeTime);
        this.notifyChangesToUsers(users, aggName, changes);
    }

}