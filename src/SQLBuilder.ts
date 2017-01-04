import {Condition} from "vesta-schema/Vql";
export enum QueryType{Select = 1, Update, Delete, Insert}
export class SQLBuilder {
    private selects:Array<any> = [];
    private froms:Array<any> = [];
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
    }
}
