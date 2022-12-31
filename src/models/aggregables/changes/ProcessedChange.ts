import { Change } from ".";

export default interface ProcessedChange extends Change { 
    changeId:   string,
    changeTime: number
    changeBy:   string;
}