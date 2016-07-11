import { Schema } from "vesta-schema/Schema";
import { Model, IModelValues } from "vesta-schema/Model";
import { Database } from "vesta-schema/Database";
import { RoleGroup, IRoleGroup } from "./RoleGroup";
export declare enum UserGender {
    Male = 1,
    Female = 2,
}
export interface IUser {
    id?: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    birthDate?: number;
    gender?: UserGender;
    image?: File | string;
    roleGroups?: Array<number | IRoleGroup | RoleGroup>;
}
export declare class User extends Model implements IUser {
    static schema: Schema;
    static database: Database;
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    birthDate: number;
    gender: UserGender;
    image: File | string;
    roleGroups: Array<number | IRoleGroup | RoleGroup>;
    constructor(values?: IModelValues);
}
