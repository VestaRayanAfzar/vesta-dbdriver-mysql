import { Model } from "vesta-schema/Model";
import { Schema } from "vesta-schema/Schema";
import { Permission, IPermission } from "./Permission";
import { Database } from "vesta-schema/Database";
export interface IRole {
    id?: number | string;
    name?: string;
    desc?: string;
    permissions?: Array<number | IPermission | Permission>;
    status?: boolean;
}
export declare class Role extends Model implements IRole {
    static schema: Schema;
    static database: Database;
    id: number | string;
    name: string;
    desc: string;
    permissions: Array<number | IPermission | Permission>;
    status: boolean;
    constructor(values?: any);
}
