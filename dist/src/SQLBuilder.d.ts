import { Condition } from "vesta-schema/Vql";
export declare enum QueryType {
    Select = 1,
    Update = 2,
    Delete = 3,
    Insert = 4,
}
export declare class SQLBuilder {
    private type;
    private selects;
    private froms;
    private condition;
    constructor(type: QueryType);
    select(field: string): void;
    from(table: string): void;
    where(condition: Condition): void;
}
