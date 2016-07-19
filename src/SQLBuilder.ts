import {Condition} from "vesta-schema/Vql";
export enum QueryType{Select = 1, Update, Delete, Insert}
export class SQLBuilder {
    private selects:Array = [];
    private froms:Array = [];
    private condition:string;

    constructor(private type:QueryType) {
    }

    public select(field:string) {
        this.selects.push(field);
    }

    public from(table:string) {
        this.froms.push(table);
    }

    public where(condition:Condition) {
        this.condition = 
    }
}
