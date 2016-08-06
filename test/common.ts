import {IModelCollection} from "vesta-schema/Database";
import {User} from "./models/User";
import {Role} from "./models/Role";
import {RoleGroup} from "./models/RoleGroup";
import {Permission} from "./models/Permission";
import {IMySQLConfig} from "../dist/src/MySQL";

export var config = <IMySQLConfig>{
    protocol: 'mysql',
    host: 'mysql',
    port: 3306,
    user: 'root',
    password: '',
    database: 'TestDB',
};
export var models = <IModelCollection>{
    User: User,
    Role: Role,
    RoleGroup: RoleGroup,
    Permissions: Permission
};

