"use strict";
var User_1 = require("./models/User");
var Role_1 = require("./models/Role");
var RoleGroup_1 = require("./models/RoleGroup");
var Permission_1 = require("./models/Permission");
exports.config = {
    protocol: 'mysql',
    host: 'mysql',
    port: '3306',
    user: 'root',
    password: '',
    database: 'TestDB',
};
exports.models = {
    User: User_1.User,
    Role: Role_1.Role,
    RoleGroup: RoleGroup_1.RoleGroup,
    Permissions: Permission_1.Permission
};
