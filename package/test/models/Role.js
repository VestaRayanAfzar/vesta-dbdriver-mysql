"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Model_1 = require("vesta-schema/Model");
var Schema_1 = require("vesta-schema/Schema");
var Field_1 = require("vesta-schema/Field");
var Permission_1 = require("./Permission");
var Role = (function (_super) {
    __extends(Role, _super);
    function Role(values) {
        _super.call(this, Role.schema, Role.database);
        this.status = true;
        this.setValues(values);
    }
    Role.schema = new Schema_1.Schema('Role');
    return Role;
}(Model_1.Model));
exports.Role = Role;
Role.schema.addField('id').type(Field_1.FieldType.Integer).primary();
Role.schema.addField('name').type(Field_1.FieldType.String).required().unique();
Role.schema.addField('desc').type(Field_1.FieldType.Text);
Role.schema.addField('permissions').type(Field_1.FieldType.Relation).areManyOf(Permission_1.Permission);
Role.schema.addField('status').type(Field_1.FieldType.Boolean).default(true).required();
Role.schema.freeze();
