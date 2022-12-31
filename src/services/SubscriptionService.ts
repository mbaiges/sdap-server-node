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
     * @param aggId
     * @returns 
     */
    subscribe(user: User, aggId: string): boolean {
        let res: boolean = true;

        const agg: FullAggregable | undefined = this.aggregableRepository.findById(aggId);
        if (!user) {
            // TODO: Throw corresponding error
            throw new Error(`No aggregable with id ${aggId} found`);
        }

        const sub: Subscription = this.subscriptionRepository.subscribe(user.id, aggId);
        res = sub && sub.userId === user.id && sub.aggId === aggId;

        return res;
    }

    /**
     * Unsubscribes an user to an aggregable
     * 
     * @param user
     * @param aggId
     * @returns 
     */
    unsubscribe(user: User, aggId: string): boolean {
        let res: boolean = true;

        const agg: FullAggregable | undefined = this.aggregableRepository.findById(aggId);
        if (!user) {
            // TODO: Throw corresponding error
            throw new Error(`No aggregable with id ${aggId} found`);
        }

        res = this.subscriptionRepository.unsubscribe(user.id, aggId);

        return res;
    }

    /**
     * Notify given users about changes under aggregable with given id
     * 
     * @param aggId
     * @returns 
     */
    notifyChangesToUsers(users: User[], aggId: string, changes: ProcessedChange[]): void {
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
                id: aggId,
                changes: othersChanges
            }

            user.ws.send(JSON.stringify(msg));
        }
    }

    /**
     * Notify subscribed users about changes under aggregable with given id
     * 
     * @param aggId
     * @returns 
     */
    notifyChanges(aggId: string, changes: ProcessedChange[]): void {
        if (changes.length === 0) {
            return;
        }

        const agg: FullAggregable | undefined = this.aggregableRepository.findById(aggId);
        if (!agg) {
            // No agg with that id found
            return;
        }

        const users: User[] = this.subscriptionRepository.findAggregableSubscriptions(aggId);

        this.notifyChangesToUsers(users, aggId, changes);
    }

    /**
     * Notify users about changes under aggregable with given id
     * 
     * @param user
     * @param aggId
     * @returns 
     */
    notifyChangesSince(users: User[], aggId: string, changeId?: string, changeTime?: number): void {
        const agg: FullAggregable | undefined = this.aggregableRepository.findById(aggId);
        if (!agg) {
            // No agg with that id found
            return;
        }

        const changes: ProcessedChange[] = this.aggregableRepository.changesSince(aggId, changeId, changeTime);
        this.notifyChangesToUsers(users, aggId, changes);
    }

}