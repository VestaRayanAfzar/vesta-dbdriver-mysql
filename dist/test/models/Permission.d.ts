import { Model } from "vesta-schema/Model";
import { Schema } from "vesta-schema/Schema";
import { Database } from "vesta-schema/Database";
export interface IPermission {
    id?: number | string;
    resource?: string;
    action?: string;
    status?: boolean;
}
export declare class Permission extends Model implements IPermission {
    static schema: Schema;
    static database: Database;
    id: number | string;
    resource: string;
    action: string;
    status: boolean;
    constructor(values?: any);
}
