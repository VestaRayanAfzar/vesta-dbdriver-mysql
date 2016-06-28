import {MySQL} from "../package/MySQL";
import {IDatabaseConfig, IModelCollection} from "vesta-schema/Database";
import {User} from "./models/User";
import {Role} from "./models/Role";
import {RoleGroup} from "./models/RoleGroup";
import {Permission} from "./models/Permission";
var config = <IDatabaseConfig>{
    protocol: 'mysql',
    host: 'mysql',
    port: '3306',
    user: 'root',
    password: '',
    database: 'TestDB',
};
var models = <IModelCollection>{
    User: User,
    Role: Role,
    RoleGroup: RoleGroup,
    Permissions: Permission
};
describe("test driver connection", function () {
    var database = new MySQL(config, models);
    database.connect()
        .then(()=> {})
        .catch((err)=> {

        })
});

describe('suite name', function () {
    it('spec name', function () {

    });
});