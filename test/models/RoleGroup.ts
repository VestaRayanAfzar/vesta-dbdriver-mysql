import {Database, FieldType, Model, Schema} from "@vesta/core";
import {IRole, Role} from "./Role";

export interface IRoleGroup {
    id?:number|string;
    name:string;
    status?:boolean;
    desc?:string;
    roles?:Array<number|IRole|Role>;
}


export class RoleGroup extends Model implements IRoleGroup {
    public static schema:Schema = new Schema('RoleGroup');
    public static database:Database;
    public id:number|string;
    public name:string;
    public status:boolean = true;
    public desc:string;
    public roles:Array<number|IRole|Role>;

    constructor(values?:any) {
        super(RoleGroup.schema, RoleGroup.database);
        this.setValues(values);
    }
}

RoleGroup.schema.addField('id').type(FieldType.Integer).primary();
RoleGroup.schema.addField('name').type(FieldType.String).required().unique();
RoleGroup.schema.addField('status').type(FieldType.Boolean).required().default(true);
RoleGroup.schema.addField('desc').type(FieldType.Text);
RoleGroup.schema.addField('roles').type(FieldType.Relation).areManyOf(Role);
RoleGroup.schema.addField('status').type(FieldType.Boolean).default(true).required();
RoleGroup.schema.freeze();