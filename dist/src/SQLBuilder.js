"use strict";
(function (QueryType) {
    QueryType[QueryType["Select"] = 1] = "Select";
    QueryType[QueryType["Update"] = 2] = "Update";
    QueryType[QueryType["Delete"] = 3] = "Delete";
    QueryType[QueryType["Insert"] = 4] = "Insert";
})(exports.QueryType || (exports.QueryType = {}));
var QueryType = exports.QueryType;
var SQLBuilder = (function () {
    function SQLBuilder(type) {
        this.type = type;
        this.selects = [];
        this.froms = [];
    }
    SQLBuilder.prototype.select = function (field) {
        this.selects.push(field);
    };
    SQLBuilder.prototype.from = function (table) {
        this.froms.push(table);
    };
    SQLBuilder.prototype.where = function (condition) {
        this.condition =
        ;
    };
    return SQLBuilder;
}());
exports.SQLBuilder = SQLBuilder;
