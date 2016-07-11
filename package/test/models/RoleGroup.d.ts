import { Model } from "vesta-schema/Model";
import { Schema } from "vesta-schema/Schema";
import { Database } from "vesta-schema/Database";
import { IRole, Role } from "./Role";
export interface IRoleGroup {
    id?: number | string;
    name: string;
    status?: boolean;
    desc?: string;
    roles?: Array<number | IRole | Role>;
}
export declare class RoleGroup extends Model implements IRoleGroup {
    static schema: Schema;
    static database: Database;
    id: number | string;
    name: string;
    status: boolean;
    desc: string;
    roles: Array<number | IRole | Role>;
    constructor(values?: any);
}
