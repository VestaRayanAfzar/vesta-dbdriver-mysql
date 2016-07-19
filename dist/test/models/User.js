"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Schema_1 = require("vesta-schema/Schema");
var Field_1 = require("vesta-schema/Field");
var Model_1 = require("vesta-schema/Model");
var RoleGroup_1 = require("./RoleGroup");
(function (UserGender) {
    UserGender[UserGender["Male"] = 1] = "Male";
    UserGender[UserGender["Female"] = 2] = "Female";
})(exports.UserGender || (exports.UserGender = {}));
var UserGender = exports.UserGender;
var User = (function (_super) {
    __extends(User, _super);
    function User(values) {
        _super.call(this, User.schema, User.database);
        this.roleGroups = [];
        this.setValues(values);
    }
    User.schema = new Schema_1.Schema('User');
    return User;
}(Model_1.Model));
exports.User = User;
User.schema.addField('id').type(Field_1.FieldType.String).primary();
User.schema.addField('username').type(Field_1.FieldType.String).unique().required();
User.schema.addField('firstName').type(Field_1.FieldType.String).minLength(2);
User.schema.addField('lastName').type(Field_1.FieldType.String).minLength(2);
User.schema.addField('email').type(Field_1.FieldType.EMail).unique();
User.schema.addField('password').type(Field_1.FieldType.Password).required().minLength(4);
User.schema.addField('birthDate').type(Field_1.FieldType.Timestamp);
User.schema.addField('gender').type(Field_1.FieldType.Enum).enum(UserGender.Male, UserGender.Female).default(UserGender.Male);
User.schema.addField('image').type(Field_1.FieldType.File).maxSize(6144).fileType('image/png', 'image/jpeg', 'image/pjpeg');
User.schema.addField('roleGroups').type(Field_1.FieldType.Relation).areManyOf(RoleGroup_1.RoleGroup);
User.schema.freeze();
