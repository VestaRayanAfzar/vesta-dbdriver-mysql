"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Model_1 = require("vesta-schema/Model");
var Schema_1 = require("vesta-schema/Schema");
var Field_1 = require("vesta-schema/Field");
var Permission = (function (_super) {
    __extends(Permission, _super);
    function Permission(values) {
        _super.call(this, Permission.schema, Permission.database);
        this.status = true;
        this.setValues(values);
    }
    Permission.schema = new Schema_1.Schema('Permission');
    return Permission;
}(Model_1.Model));
exports.Permission = Permission;
Permission.schema.addField('id').type(Field_1.FieldType.Integer).primary();
Permission.schema.addField('resource').type(Field_1.FieldType.String).required();
Permission.schema.addField('action').type(Field_1.FieldType.String).required();
Permission.schema.addField('status').type(Field_1.FieldType.Boolean).default(true).required();
Permission.schema.freeze();
