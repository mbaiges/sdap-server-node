import * as WebSocket from "ws";
import { Service } from "typedi";
import { JSONSchema7 } from "json-schema";

import { 
    Message, 
    MessageType, 
    CreateRequestMessage, 
    CreateResponseMessage,
    GetRequestMessage,
    GetResponseMessage,
    SchemaRequestMessage, 
    SchemaResponseMessage,
    UpdateRequestMessage,
    UpdateResponseMessage
} from "../models/messages";
import { Aggregable } from "../models/aggregables";
import { ChangeResult } from "../models/aggregables/changes"
import { AggregableService } from "../services"
import { ConsoleLogger } from "../utils";

@Service()
export default class MainController {
    constructor(
        readonly logger: ConsoleLogger,
        readonly aggregableService: AggregableService
    ) {}

    processMessage(ws: WebSocket, message: string) : void {
        try {
            this.logger.log(`received: ${message}`);

            const msg : Message = this.#parseMessage(message);
            this.#handleMessage(ws, msg);
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
    
    #handleMessage(ws: WebSocket, msg: Message) {
        console.log("message");
        console.log(msg);
        switch(msg.type) {
            case MessageType.Create:
                this.#handleCreateRequest(ws, msg as CreateRequestMessage);
                break;
            case MessageType.Get:
                this.#handleGetRequest(ws, msg as GetRequestMessage);
                break;
            case MessageType.Schema:
                this.#handleSchemaRequest(ws, msg as SchemaRequestMessage);
                break;
            case MessageType.Update:
                this.#handleUpdateRequest(ws, msg as UpdateRequestMessage);
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
     #handleCreateRequest(ws: WebSocket, msg: CreateRequestMessage) {
        const schema = msg.schema;
        const value  = msg.value;
        
        // Service
        console.log(schema);
        console.log(value);
        const created: Aggregable = this.aggregableService.create(schema, value);
        console.log(created);

        // Response
        const resp: CreateResponseMessage = {
            type: MessageType.Create,
            created: created
        };

        ws.send(JSON.stringify(resp));
    }

    /**
     * Get
     */
    #handleGetRequest(ws: WebSocket, msg: GetRequestMessage) {
        // Service
        const { id } = msg;
        const agg: Aggregable | undefined = this.aggregableService.getById(id);

        if (!agg) {
            this.logger.log(`Aggregable with id '${id}' not found`);
            return;
        }

        // Response
        const resp: GetResponseMessage = {
            type: MessageType.Get,
            value: agg.value
        };

        ws.send(JSON.stringify(resp));
    }
    
    /**
     * Schema
     */
    #handleSchemaRequest(ws: WebSocket, msg: SchemaRequestMessage) {
        const { id } = msg;
        
        // Service
        const schema: JSONSchema7 | undefined = this.aggregableService.getSchema(id);

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

        ws.send(JSON.stringify(resp));
    }

    /**
     * Update
     */
    #handleUpdateRequest(ws: WebSocket, msg: UpdateRequestMessage) {
        const { id, updates } = msg;
        
        // Service
        const updateResults: ChangeResult[] = this.aggregableService.update(id, updates);

        if (!updateResults) {
            // TODO: Make it an exception
            this.logger.log(`Aggregable with id '${id}' not found`);
            return;
        }

        // Response
        const resp: UpdateResponseMessage = {
            type: MessageType.Update,
            results: []
        };

        ws.send(JSON.stringify(resp));
    }
    
    /**
     * Changes
     */
}