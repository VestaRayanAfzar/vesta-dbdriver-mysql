"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Model_1 = require("vesta-schema/Model");
var Schema_1 = require("vesta-schema/Schema");
var Field_1 = require("vesta-schema/Field");
var Role_1 = require("./Role");
var RoleGroup = (function (_super) {
    __extends(RoleGroup, _super);
    function RoleGroup(values) {
        _super.call(this, RoleGroup.schema, RoleGroup.database);
        this.status = true;
        this.setValues(values);
    }
    RoleGroup.schema = new Schema_1.Schema('RoleGroup');
    return RoleGroup;
}(Model_1.Model));
exports.RoleGroup = RoleGroup;
RoleGroup.schema.addField('id').type(Field_1.FieldType.Integer).primary();
RoleGroup.schema.addField('name').type(Field_1.FieldType.String).required().unique();
RoleGroup.schema.addField('status').type(Field_1.FieldType.Boolean).required().default(true);
RoleGroup.schema.addField('desc').type(Field_1.FieldType.Text);
RoleGroup.schema.addField('roles').type(Field_1.FieldType.Relation).areManyOf(Role_1.Role);
RoleGroup.schema.addField('status').type(Field_1.FieldType.Boolean).default(true).required();
RoleGroup.schema.freeze();
