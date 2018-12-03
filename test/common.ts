import {User} from "./models/User";
import {Role} from "./models/Role";
import {RoleGroup} from "./models/RoleGroup";
import {Permission} from "./models/Permission";
import {IMySQLConfig} from "../src/MySQL";
import {IModelCollection} from "@vesta/core";

export var config = <IMySQLConfig>{
    protocol: 'mysql',
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'pass',
    database: 'test',
};
export var models = <IModelCollection>{
    User: User,
    Role: Role,
    RoleGroup: RoleGroup,
    Permissions: Permission
};

