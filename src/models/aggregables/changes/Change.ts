import { ChangeOperation } from "./operations";

export default interface Change { 
    [key: string]: ChangeOperation; 
}