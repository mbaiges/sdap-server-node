import { Change } from ".";

export default interface ProcessedChange extends Change { 
    changeId: string,
    changeAt: number
    changeBy: string;
}