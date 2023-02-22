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
    DeleteRequestMessage,
    DeleteResponseMessage,
    UpdateRequestMessage,
    UpdateResponseMessage,
    SubscribeRequestMessage,
    SubscribeResponseMessage,
    UnsubscribeRequestMessage,
    UnsubscribeResponseMessage
} from "../models/messages";
import { User } from "../models/users";
import { Aggregable, FullAggregable } from "../models/aggregables";
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
            const user : User | undefined = this.userService.findByWs(ws);
            this.logger.log(`\\${user?.username}\\ - Received: ${message}`);
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
            this.logger.log(`\\${user?.username}\\ - Disconnected`);
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
            case MessageType.Delete:
                this.#handleDeleteRequest(user, msg as DeleteRequestMessage);
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
                this.logger.log(`\\${user?.username}\\ - Message of type ${msg.type} unrecognized`);
                // TODO: return error
        }
    }
    
    // Handlers

    /**
     * Hello
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
        const name   = msg.name;
        const schema = msg.schema;
        const value  = msg.value;
        
        // Service
        const created: Aggregable = this.aggregableService.create(user, name, schema, value);
        console.log(created);

        // Response
        const resp: CreateResponseMessage = {
            type:    MessageType.Create,
            name:    created.name,
            created: {
                name:   created.name,
                schema: created.schema,
                value:  created.value
            }
        };
        user.ws.send(JSON.stringify(resp));
    }

    /**
     * Delete
     */
    #handleDeleteRequest(user: User, msg: DeleteRequestMessage) {
        const name   = msg.name;
        
        // Service
        const deleted: boolean = this.aggregableService.delete(user, name);

        // Response
        const resp: DeleteResponseMessage = {
            type:    MessageType.Delete,
            name:    name,
            success: deleted
        };
        user.ws.send(JSON.stringify(resp));
    }

    /**
     * Get
     */
    #handleGetRequest(user: User, msg: GetRequestMessage) {
        // Service
        const { name } = msg;
        const agg: FullAggregable | undefined = this.aggregableService.findByName(user, name);

        if (!agg) {
            this.logger.log(`\\${user?.username}\\ - Aggregable with name '${name}' not found`);
            return;
        }

        // Response
        const resp: GetResponseMessage = {
            type:  MessageType.Get,
            name:  agg.name,
            value: agg.value
        };

        if (!!agg.changes && agg.changes.length > 0) {
            const lastChange = agg.changes[agg.changes.length-1];
            resp.lastChangeId = lastChange.changeId;
            resp.lastChangeAt = lastChange.changeAt;
        }

        user.ws.send(JSON.stringify(resp));
    }
    
    /**
     * Schema
     */
    #handleSchemaRequest(user: User, msg: SchemaRequestMessage) {
        const { name } = msg;
        
        // Service
        const schema: JSONSchema7 | undefined = this.aggregableService.schema(user, name);

        if (!schema) {
            this.logger.log(`\\${user?.username}\\ - Aggregable with name '${name}' not found`);
            return;
        }

        // Response
        const resp: SchemaResponseMessage = {
            type: MessageType.Schema,
            name,
            schema
        };
        user.ws.send(JSON.stringify(resp));
    }

    /**
     * Update
     */
    #handleUpdateRequest(user: User, msg: UpdateRequestMessage) {
        const { name, updates } = msg;
        
        // Service
        const [updateResults, changes] = this.aggregableService.update(user, name, updates);

        // Response
        const resp: UpdateResponseMessage = {
            type:    MessageType.Update,
            name:    name,
            results: updateResults
        };
        user.ws.send(JSON.stringify(resp));

        // Notify changes
        this.subscriptionService.notifyChanges(name, changes);
    }
    
    /**
     * Subscribe
     */
    #handleSubscribeRequest(user: User, msg: SubscribeRequestMessage) {
        const { name, lastChangeId, lastChangeAt, compactPeriodically } = msg;
        
        // Service
        const res: boolean = this.subscriptionService.subscribe(user, name);

        if (!res) {
            // TODO: Handle this case
        }

        // Response
        const resp: SubscribeResponseMessage = {
            type:    MessageType.Subscribe,
            name:    name,
            success: res
        };
        user.ws.send(JSON.stringify(resp));

        if (res) {
            // console.log("Now notifying since " + lastChangeId + " and " + lastChangeAt);
            this.subscriptionService.notifyChangesSince([user], name, lastChangeId, lastChangeAt);
        }
    }

    /**
     * Unsubscribe
     */
    #handleUnsubscribeRequest(user: User, msg: UnsubscribeRequestMessage) {
        const { name } = msg;

        let res: boolean = true
        
        // Service
        try {
            this.subscriptionService.unsubscribe(user, name);
        } catch (error) {
            // Always returns success
            // No matter if the aggregable was not found
        }

        // Response
        const resp: UnsubscribeResponseMessage = {
            type:    MessageType.Unsubscribe,
            name:    name,
            success: true
        };
        user.ws.send(JSON.stringify(resp));
    }
}