import * as WebSocket from "ws";
import { Service } from "typedi";
import { JSONSchema7 } from "json-schema";

import { 
    Message, 
    MessageType, 
    HelloRequestMessage,
    HelloResponseMessage,
    CreateRequestMessage, 
    CreateResponseMessage,
    GetRequestMessage,
    GetResponseMessage,
    SchemaRequestMessage, 
    SchemaResponseMessage,
    UpdateRequestMessage,
    UpdateResponseMessage,
    SubscribeRequestMessage,
    SubscribeResponseMessage,
    UnsubscribeRequestMessage,
    UnsubscribeResponseMessage
} from "../models/messages";
import { User } from "../models/users";
import { Aggregable, FullAggregable } from "../models/aggregables";
import { ChangeResult } from "../models/aggregables/changes"
import { UserService, AggregableService, SubscriptionService } from "../services"
import { ConsoleLogger } from "../utils";

@Service()
export default class MainController {
    constructor(
        readonly logger: ConsoleLogger,
        readonly userService: UserService,
        readonly aggregableService: AggregableService,
        readonly subscriptionService: SubscriptionService
    ) {}

    init(ws: WebSocket): void {
        // Do nothing for now, there is a hello request
    }

    processMessage(ws: WebSocket, message: string) : void {
        try {
            this.logger.log(`received: ${message}`);
            const user : User | undefined = this.userService.findByWs(ws);
            const msg : Message = this.#parseMessage(message);
            this.#handleMessage(ws, user, msg);
        } catch(error) {
            this.logger.error("There's been an error");
            console.log(error);
        }
    }

    close(ws: WebSocket) : void {
        try {
            const user : User | undefined = this.userService.findByWs(ws);
            this.userService.delete(ws);
            this.logger.log(`USER ${user?.id} - disconnected`);
        } catch(error) {
            this.logger.error("There's been an error");
            console.log(error);
        }
    }

    #parseMessage(message: string) : Message {
        let msg : Message;
        
        try {
            msg = JSON.parse(message);
        } catch (error) {
            throw new Error();
        }
    
        return msg;
    }
    
    #handleMessage(ws: WebSocket, user: User | undefined, msg: Message) {
        if (!user) {
            if (msg.type === MessageType.Hello) {
                this.#handleHelloRequest(ws, msg as HelloRequestMessage);
            } else {
                this.logger.error("Unauthenticated");
                throw new Error("Unauthorized"); // TODO: Error handling
            }
            return;
        }

        switch(msg.type) {
            case MessageType.Create:
                this.#handleCreateRequest(user, msg as CreateRequestMessage);
                break;
            case MessageType.Get:
                this.#handleGetRequest(user, msg as GetRequestMessage);
                break;
            case MessageType.Schema:
                this.#handleSchemaRequest(user, msg as SchemaRequestMessage);
                break;
            case MessageType.Update:
                this.#handleUpdateRequest(user, msg as UpdateRequestMessage);
                break;
            case MessageType.Subscribe:
                this.#handleSubscribeRequest(user, msg as SubscribeRequestMessage);
                break;
            case MessageType.Unsubscribe:
                this.#handleUnsubscribeRequest(user, msg as UnsubscribeRequestMessage);
                break;
            default:
                this.logger.log(`Message of type ${msg.type} unrecognized`);
                // TODO: return error
        }
    }
    
    // Handlers

    /**
     * Create
     */
    #handleHelloRequest(ws: WebSocket, msg: HelloRequestMessage) {
        const { username } = msg;
        
        // Service
        const created: User | undefined = this.userService.register(ws, username);

        // Response
        const resp: HelloResponseMessage = {
            type:     MessageType.Hello,
            username: username,
            success:  !!created
        };
        if (created) {
            resp.newUsername = created.username;
        }

        ws.send(JSON.stringify(resp));
    }

    /**
     * Create
     */
     #handleCreateRequest(user: User, msg: CreateRequestMessage) {
        const schema = msg.schema;
        const value  = msg.value;
        
        // Service
        const created: Aggregable = this.aggregableService.create(user, schema, value);
        console.log(created);

        // Response
        const resp: CreateResponseMessage = {
            type:    MessageType.Create,
            id:      created.id,
            created: created
        };
        user.ws.send(JSON.stringify(resp));
    }

    /**
     * Get
     */
    #handleGetRequest(user: User, msg: GetRequestMessage) {
        // Service
        const { id } = msg;
        const agg: FullAggregable | undefined = this.aggregableService.findById(user, id);

        if (!agg) {
            this.logger.log(`Aggregable with id '${id}' not found`);
            return;
        }

        // Response
        const resp: GetResponseMessage = {
            type:  MessageType.Get,
            id:    agg.id,
            value: agg.value
        };

        if (!!agg.changes && agg.changes.length > 0) {
            const lastChange = agg.changes[agg.changes.length-1];
            resp.lastChangeId   = lastChange.changeId;
            resp.lastChangeTime = lastChange.changeTime;
        }

        user.ws.send(JSON.stringify(resp));
    }
    
    /**
     * Schema
     */
    #handleSchemaRequest(user: User, msg: SchemaRequestMessage) {
        const { id } = msg;
        
        // Service
        const schema: JSONSchema7 | undefined = this.aggregableService.schema(user, id);

        if (!schema) {
            this.logger.log(`Aggregable with id '${id}' not found`);
            return;
        }

        // Response
        const resp: SchemaResponseMessage = {
            type: MessageType.Schema,
            id,
            schema
        };
        user.ws.send(JSON.stringify(resp));
    }

    /**
     * Update
     */
    #handleUpdateRequest(user: User, msg: UpdateRequestMessage) {
        const { id, updates } = msg;
        
        // Service
        const [updateResults, changes] = this.aggregableService.update(user, id, updates);

        // Response
        const resp: UpdateResponseMessage = {
            type: MessageType.Update,
            id:   id,
            results: updateResults
        };
        user.ws.send(JSON.stringify(resp));

        // Notify changes
        this.subscriptionService.notifyChanges(id, changes);
    }
    
    /**
     * Subscribe
     */
    #handleSubscribeRequest(user: User, msg: SubscribeRequestMessage) {
        const { id, lastChangeId, lastChangeTime, compactPeriodically } = msg;
        
        // Service
        const res: boolean = this.subscriptionService.subscribe(user, id);

        if (!res) {
            // TODO: Handle this case
        }

        // Response
        const resp: SubscribeResponseMessage = {
            type:    MessageType.Subscribe,
            id:      id,
            success: res
        };
        user.ws.send(JSON.stringify(resp));

        if (res) {
            console.log("Now notifying since " + lastChangeId + " and " + lastChangeTime);
            this.subscriptionService.notifyChangesSince([user], id, lastChangeId, lastChangeTime);
        }
    }

    /**
     * Unsubscribe
     */
    #handleUnsubscribeRequest(user: User, msg: UnsubscribeRequestMessage) {
        const { id } = msg;

        let res: boolean = true
        
        // Service
        try {
            this.subscriptionService.unsubscribe(user, id);
        } catch (error) {
            // Always returns success
            // No matter if the aggregable was not found
        }

        // Response
        const resp: UnsubscribeResponseMessage = {
            type:    MessageType.Unsubscribe,
            id:      id,
            success: true
        };
        user.ws.send(JSON.stringify(resp));
    }
}