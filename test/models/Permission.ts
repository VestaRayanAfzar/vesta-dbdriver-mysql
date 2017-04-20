import {Database, FieldType, Model, Schema} from "vesta-lib";

export interface IPermission {
    id?: number | string;
    resource?: string;
    action?: string;
    status?: boolean;
}


export class Permission extends Model implements IPermission {
    public static schema: Schema = new Schema('Permission');
    public static database: Database;
    public id: number | string;
    public resource: string;
    public action: string;
    public status: boolean = true;

    constructor(values?: any) {
        super(Permission.schema, Permission.database);
        this.setValues(values);
    }
}

Permission.schema.addField('id').type(FieldType.Integer).primary();
Permission.schema.addField('resource').type(FieldType.String).required();
Permission.schema.addField('action').type(FieldType.String).required();
Permission.schema.addField('status').type(FieldType.Boolean).default(true).required();
Permission.schema.freeze();