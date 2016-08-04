"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var mysql = require("mysql");
var Schema_1 = require("vesta-schema/Schema");
var Database_1 = require("vesta-schema/Database");
var Err_1 = require("vesta-util/Err");
var DatabaseError_1 = require("vesta-schema/error/DatabaseError");
var Vql_1 = require("vesta-schema/Vql");
var Field_1 = require("vesta-schema/Field");
var MySQL = (function (_super) {
    __extends(MySQL, _super);
    function MySQL(config, models) {
        _super.call(this);
        this.schemaList = {};
        this.primaryKeys = {};
        this.schemaList = {};
        for (var model in models) {
            if (models.hasOwnProperty(model)) {
                this.schemaList[model] = models[model].schema;
                this.pk(model);
            }
        }
        this.models = models;
        this.config = config;
    }
    MySQL.prototype.connect = function () {
        var _this = this;
        if (this.connection)
            return Promise.resolve(this);
        return new Promise(function (resolve, reject) {
            if (!_this.pool) {
                _this.pool = mysql.createPool({
                    host: _this.config.host,
                    port: +_this.config.port,
                    user: _this.config.user,
                    password: _this.config.password,
                    database: _this.config.database
                });
            }
            _this.pool.getConnection(function (err, connection) {
                if (err)
                    return reject(new DatabaseError_1.DatabaseError(Err_1.Err.Code.DBConnection, err && err.message));
                _this.connection = connection;
                resolve(_this);
            });
        });
    };
    MySQL.prototype.pk = function (modelName) {
        if (this.primaryKeys[modelName]) {
            return this.primaryKeys[modelName];
        }
        else {
            var fields = this.schemaList[modelName].getFields();
            for (var field in fields) {
                if (fields.hasOwnProperty(field)) {
                    if (fields[field].properties.primary) {
                        this.primaryKeys[modelName] = field;
                        return field;
                    }
                }
            }
        }
        this.primaryKeys[modelName] = 'id';
        return 'id';
    };
    MySQL.prototype.init = function () {
        var createSchemaPromise = this.initializeDatabase();
        for (var schema in this.schemaList) {
            if (this.schemaList.hasOwnProperty(schema)) {
                createSchemaPromise = createSchemaPromise.then(this.createTable(this.schemaList[schema]));
            }
        }
        return createSchemaPromise;
    };
    MySQL.prototype.findById = function (model, id, option) {
        if (option === void 0) { option = {}; }
        var query = new Vql_1.Vql(model);
        query.where(new Vql_1.Condition(Vql_1.Condition.Operator.EqualTo).compare(this.pk(model), id));
        if (option.fields)
            query.select.apply(query, option.fields);
        if (option.relations)
            query.fetchRecordFor.apply(query, option.relations);
        query.orderBy = option.orderBy || [];
        query.limitTo(1);
        return this.findByQuery(query);
    };
    MySQL.prototype.findByModelValues = function (model, modelValues, option) {
        if (option === void 0) { option = {}; }
        var condition = new Vql_1.Condition(Vql_1.Condition.Operator.And);
        for (var key in modelValues) {
            if (modelValues.hasOwnProperty(key)) {
                condition.append((new Vql_1.Condition(Vql_1.Condition.Operator.EqualTo)).compare(key, modelValues[key]));
            }
        }
        var query = new Vql_1.Vql(model);
        if (option.fields)
            query.select.apply(query, option.fields);
        if (option.offset || option.page)
            query.fromOffset(option.offset ? option.offset : (option.page - 1) * option.limit);
        if (option.relations)
            query.fetchRecordFor.apply(query, option.relations);
        if (+option.limit)
            query.limitTo(option.limit);
        query.where(condition);
        query.orderBy = option.orderBy || [];
        return this.findByQuery(query);
    };
    MySQL.prototype.findByQuery = function (query) {
        var _this = this;
        var params = this.getQueryParams(query);
        var result = {};
        params.condition = params.condition ? 'WHERE ' + params.condition : '';
        params.orderBy = params.orderBy ? 'ORDER BY ' + params.orderBy : '';
        var totalPromise = this.query("SELECT COUNT(*) as total FROM `" + query.model + "` " + params.join + " " + params.condition);
        var itemsPromise = this.query("SELECT " + params.fields + " FROM `" + query.model + "` " + params.join + " " + params.condition + " " + params.orderBy + " " + params.limit);
        return Promise.all([totalPromise, itemsPromise])
            .then(function (data) {
            var list = data[1];
            result.total = data[0][0]['total'];
            return _this.getManyToManyRelation(list, query)
                .then(function (list) {
                result.items = _this.normalizeList(_this.schemaList[query.model], list);
                return result;
            });
        })
            .catch(function (err) {
            if (err) {
                result.error = new Err_1.Err(Err_1.Err.Code.DBQuery, err && err.message);
                return Promise.reject(result);
            }
        });
    };
    MySQL.prototype.insertOne = function (model, value) {
        var _this = this;
        var result = {};
        var analysedValue = this.getAnalysedValue(model, value);
        var properties = [];
        for (var i = analysedValue.properties.length; i--;) {
            properties.push("`" + analysedValue.properties[i].field + "` = " + analysedValue.properties[i].value);
        }
        return this.query("INSERT INTO `" + model + "` SET " + properties.join(','))
            .then(function (insertResult) {
            var steps = [];
            for (var key in analysedValue.relations) {
                if (analysedValue.relations.hasOwnProperty(key)) {
                    steps.push(_this.addRelation(new _this.models[model]({ id: insertResult['insertId'] }), key, analysedValue.relations[key]));
                }
            }
            var id = insertResult['insertId'];
            return Promise.all(steps).then(function () { return _this.query("SELECT * FROM `" + model + "` WHERE " + _this.pk(model) + " = " + id); });
        })
            .then(function (list) {
            result.items = list;
            return result;
        })
            .catch(function (err) {
            result.error = new Err_1.Err(Err_1.Err.Code.DBInsert, err && err.message);
            return Promise.reject(result);
        });
    };
    MySQL.prototype.insertAll = function (model, value) {
        var result = {};
        var fields = this.schemaList[model].getFields();
        var fieldsName = [];
        var insertList = [];
        for (var field in fields) {
            if (fields.hasOwnProperty(field) && fields[field].properties.type != Field_1.FieldType.Relation || fields[field].properties.relation.type != Field_1.Relationship.Type.Many2Many) {
                fieldsName.push(field);
            }
        }
        for (var i = value.length; i--;) {
            var insertPart = [];
            for (var j = fieldsName.length; j--;) {
                insertPart.push(value[i].hasOwnProperty(fieldsName[j]) ? this.escape(value[i][fieldsName[j]]) : '\'\'');
            }
            insertList.push("(" + insertPart.join(',') + ")");
        }
        if (!insertList.length) {
            result.items = [];
            return Promise.resolve(result);
        }
        return this.query("INSERT INTO " + model + "} (" + fieldsName.join(',') + ") VALUES " + insertList.join(','))
            .then(function (insertResult) {
            result.items = insertResult;
            return result;
        })
            .catch(function (err) {
            result.error = new Err_1.Err(Err_1.Err.Code.DBInsert, err && err.message);
            return Promise.reject(result);
        });
    };
    MySQL.prototype.addRelation = function (model, relation, value) {
        var modelName = model.constructor['schema'].name;
        var fields = this.schemaList[modelName].getFields();
        if (fields[relation] && fields[relation].properties.type == Field_1.FieldType.Relation && value) {
            if (fields[relation].properties.relation.type != Field_1.Relationship.Type.Many2Many) {
                return this.addOneToManyRelation(model, relation, value);
            }
            else {
                return this.addManyToManyRelation(model, relation, value);
            }
        }
        return Promise.reject(new Err_1.Err(Err_1.Err.Code.DBInsert, 'error in adding relation'));
    };
    MySQL.prototype.removeRelation = function (model, relation, condition) {
        var modelName = model.constructor['schema'].name;
        var relatedModelName = this.schemaList[modelName].getFields()[relation].properties.relation.model.schema.name;
        var safeCondition;
        if (typeof condition == 'number') {
            safeCondition = new Vql_1.Condition(Vql_1.Condition.Operator.EqualTo);
            safeCondition.compare(this.pk(relatedModelName), condition);
        }
        else if (condition instanceof Array && condition.length) {
            safeCondition = new Vql_1.Condition(Vql_1.Condition.Operator.Or);
            for (var i = condition.length; i--;) {
                safeCondition.append((new Vql_1.Condition(Vql_1.Condition.Operator.EqualTo)).compare(this.pk(relatedModelName), condition[i]));
            }
        }
        else if (condition instanceof Vql_1.Condition) {
            safeCondition = condition;
        }
        var fields = this.schemaList[modelName].getFields();
        if (fields[relation] && fields[relation].properties.type == Field_1.FieldType.Relation) {
            if (fields[relation].properties.relation.type != Field_1.Relationship.Type.Many2Many) {
                return this.removeOneToManyRelation(model, relation);
            }
            else {
                return this.removeManyToManyRelation(model, relation, safeCondition);
            }
        }
        return Promise.reject(new Err_1.Err(Err_1.Err.Code.DBDelete, 'error in removing relation'));
    };
    MySQL.prototype.updateRelations = function (model, relation, relatedValues) {
        var _this = this;
        var modelName = model.constructor['schema'].name;
        var relatedModelName = this.schemaList[modelName].getFields()[relation].properties.relation.model.schema.name;
        var ids = [0];
        if (relatedValues instanceof Array) {
            for (var i = relatedValues.length; i--;) {
                if (relatedValues[i]) {
                    ids.push(typeof relatedValues[i] == 'object' ? relatedValues[i][this.pk(relatedModelName)] : relatedValues[i]);
                }
            }
        }
        return this.query("DELETE FROM " + this.pascalCase(modelName) + "Has" + this.pascalCase(relation) + " \n                    WHERE " + this.camelCase(modelName) + " = " + model[this.pk(modelName)])
            .then(function () {
            return _this.addRelation(model, relation, ids);
        });
    };
    MySQL.prototype.updateOne = function (model, value) {
        var _this = this;
        var result = {};
        var analysedValue = this.getAnalysedValue(model, value);
        var properties = [];
        for (var i = analysedValue.properties.length; i--;) {
            if (analysedValue.properties[i].field != this.pk(model)) {
                properties.push("`" + analysedValue.properties[i].field + "` = " + analysedValue.properties[i].value);
            }
        }
        var id = value[this.pk(model)];
        var steps = [];
        var relationsNames = Object.keys(analysedValue.relations);
        var modelFields = this.schemaList[model].getFields();
        for (var i = relationsNames.length; i--;) {
            var relation = relationsNames[i];
            var relationValue = analysedValue.relations[relation];
            // todo check if it is required
            if (!relationValue)
                continue;
            if (modelFields[relation].properties.relation.type == Field_1.Relationship.Type.Many2Many) {
                steps.push(this.updateRelations(new this.models[model](value), relation, relationValue));
            }
            else {
                var fk = +relationValue;
                if (!fk && 'object' == typeof relationValue) {
                    var relatedModelName = modelFields[relation].properties.relation.model.schema.name;
                    fk = +relationValue[this.pk(relatedModelName)];
                }
                if (fk) {
                    properties.push("`" + relation + "` = " + fk);
                }
            }
        }
        return Promise.all(steps)
            .then(function () { return _this.query("UPDATE `" + model + "` SET " + properties.join(',') + " WHERE " + _this.pk(model) + " = " + id); })
            .then(function () { return _this.findById(model, id); })
            .catch(function (err) {
            result.error = new Err_1.Err(Err_1.Err.Code.DBQuery, err && err.message);
            return Promise.reject(result);
        });
    };
    MySQL.prototype.updateAll = function (model, newValues, condition) {
        var _this = this;
        var sqlCondition = this.getCondition(model, condition);
        var result = {};
        var properties = [];
        for (var key in newValues) {
            if (newValues.hasOwnProperty(key) && this.schemaList[model].getFieldsNames().indexOf(key) >= 0 && key != this.pk(model)) {
                properties.push("`" + model + "`." + key + " = '" + newValues[key] + "'");
            }
        }
        return this.query("SELECT " + this.pk(model) + " FROM `" + model + "` " + (sqlCondition ? "WHERE " + sqlCondition : ''))
            .then(function (list) {
            var ids = [];
            for (var i = list.length; i--;) {
                ids.push(list[i][_this.pk(model)]);
            }
            if (!ids.length)
                return [];
            return _this.query("UPDATE `" + model + "` SET " + properties.join(',') + "  WHERE " + _this.pk(model) + " IN (" + ids.join(',') + ")}")
                .then(function (updateResult) {
                return _this.query("SELECT * FROM `" + model + "` WHERE " + _this.pk(model) + " IN (" + ids.join(',') + ")");
            });
        })
            .then(function (list) {
            result.items = list;
            return result;
        })
            .catch(function (err) {
            result.error = new Err_1.Err(Err_1.Err.Code.DBUpdate, err && err.message);
            return Promise.reject(result);
        });
    };
    MySQL.prototype.deleteOne = function (model, id) {
        var _this = this;
        var result = {};
        var fields = this.schemaList[model].getFields();
        return this.query("DELETE FROM `" + model + "` WHERE " + this.pk(model) + " = " + id)
            .then(function (deleteResult) {
            for (var field in _this.schemaList[model].getFields()) {
                if (fields.hasOwnProperty(field) && fields[field].properties.type == Field_1.FieldType.Relation) {
                    _this.removeRelation(model, field, 0);
                }
            }
            result.items = [id];
            return result;
        })
            .catch(function (err) {
            result.error = new Err_1.Err(Err_1.Err.Code.DBDelete, err && err.message);
            return Promise.reject(result);
        });
    };
    MySQL.prototype.deleteAll = function (model, condition) {
        var _this = this;
        var sqlCondition = this.getCondition(model, condition);
        var result = {};
        return this.query("SELECT " + this.pk(model) + " FROM `" + model + "` " + (sqlCondition ? "WHERE " + sqlCondition : ''))
            .then(function (list) {
            var ids = [];
            for (var i = list.length; i--;) {
                ids.push(list[i][_this.pk(model)]);
            }
            if (!ids.length)
                return [];
            return _this.query("DELETE FROM `" + model + "` WHERE " + _this.pk(model) + " IN (" + ids.join(',') + ")")
                .then(function (deleteResult) {
                return ids;
            });
        })
            .then(function (ids) {
            result.items = ids;
            return result;
        })
            .catch(function (err) {
            result.error = new Err_1.Err(Err_1.Err.Code.DBDelete, err && err.message);
            return Promise.reject(result);
        });
    };
    MySQL.prototype.getAnalysedValue = function (model, value) {
        var properties = [];
        var schemaFieldsName = this.schemaList[model].getFieldsNames();
        var schemaFields = this.schemaList[model].getFields();
        var relations = {};
        for (var key in value) {
            if (value.hasOwnProperty(key) && schemaFieldsName.indexOf(key) >= 0 && value[key] !== undefined) {
                if (schemaFields[key].properties.type != Field_1.FieldType.Relation) {
                    var thisValue = "" + this.escape(value[key]);
                    properties.push({ field: key, value: thisValue });
                }
                else {
                    relations[key] = value[key];
                }
            }
        }
        return {
            properties: properties,
            relations: relations,
        };
    };
    MySQL.prototype.getQueryParams = function (query, alias) {
        if (alias === void 0) { alias = query.model; }
        var params = {};
        query.offset = query.offset ? query.offset : (query.page ? query.page - 1 : 0) * query.limit;
        params.limit = '';
        if (+query.limit) {
            params.limit = "LIMIT " + (query.offset ? +query.offset : 0) + ", " + +query.limit + " ";
        }
        params.orderBy = '';
        if (query.orderBy.length) {
            var orderArray = [];
            for (var i = 0; i < query.orderBy.length; i++) {
                orderArray.push("`" + alias + "`." + query.orderBy[i].field + " " + (query.orderBy[i].ascending ? 'ASC' : 'DESC'));
            }
            params.orderBy = orderArray.join(',');
        }
        var fields = [];
        var modelFields = this.schemaList[query.model].getFields();
        if (query.fields && query.fields.length) {
            for (var i = 0; i < query.fields.length; i++) {
                fields.push("`" + alias + "`." + query.fields[i]);
            }
        }
        else {
            for (var key in modelFields) {
                if (modelFields.hasOwnProperty(key)) {
                    if (modelFields[key].properties.type != Field_1.FieldType.Relation) {
                        fields.push("`" + alias + "`." + modelFields[key].fieldName);
                    }
                    else if ((!query.relations || query.relations.indexOf(modelFields[key].fieldName) < 0) && modelFields[key].properties.relation.type != Field_1.Relationship.Type.Many2Many) {
                        fields.push("`" + alias + "`." + modelFields[key].fieldName);
                    }
                }
            }
        }
        for (var i = 0; i < query.relations.length; i++) {
            var relationName = typeof query.relations[i] == 'string' ? query.relations[i] : query.relations[i]['name'];
            var field = modelFields[relationName];
            if (!field) {
                throw "FIELD " + relationName + " NOT FOUND IN model " + query.model + " as " + alias;
            }
            var properties = field.properties;
            if (properties.type == Field_1.FieldType.Relation) {
                if (properties.relation.type == Field_1.Relationship.Type.One2Many || properties.relation.type == Field_1.Relationship.Type.One2One) {
                    var modelFiledList = [];
                    var filedNameList = properties.relation.model.schema.getFieldsNames();
                    var relatedModelFields = properties.relation.model.schema.getFields();
                    for (var j = 0; j < filedNameList.length; j++) {
                        if (typeof query.relations[i] == 'string' || query.relations[i]['fields'].indexOf(filedNameList[j]) >= 0) {
                            if (relatedModelFields[filedNameList[j]].properties.type != Field_1.FieldType.Relation || relatedModelFields[filedNameList[j]].properties.relation.type != Field_1.Relationship.Type.Many2Many) {
                                modelFiledList.push("'\"" + filedNameList[j] + "\":','\"',c." + filedNameList[j] + ",'\"'");
                            }
                        }
                    }
                    var name = properties.relation.model.schema.name;
                    modelFiledList.length && fields.push("(SELECT CONCAT('{'," + modelFiledList.join(',",",') + ",'}') FROM `" + name + "` as c WHERE c." + this.pk(name) + " = `" + alias + "`." + field.fieldName + "  LIMIT 1) as " + field.fieldName);
                }
            }
        }
        params.condition = '';
        if (query.condition) {
            params.condition = this.getCondition(alias, query.condition);
            params.condition = params.condition ? params.condition : '';
        }
        params.join = '';
        if (query.joins && query.joins.length) {
            var joins = [];
            for (var i = 0; i < query.joins.length; i++) {
                var join = query.joins[i];
                var type = '';
                switch (join.type) {
                    case Vql_1.Vql.Join:
                        type = 'FULL OUTER JOIN';
                        break;
                    case Vql_1.Vql.LeftJoin:
                        type = 'LEFT JOIN';
                        break;
                    case Vql_1.Vql.RightJoin:
                        type = 'RIGHT JOIN';
                        break;
                    case Vql_1.Vql.InnerJoin:
                        type = 'INNER JOIN';
                        break;
                    default:
                        type = 'LEFT JOIN';
                }
                var modelsAlias = join.vql.model + Math.floor(Math.random() * 100).toString();
                joins.push(type + " " + join.vql.model + " as " + modelsAlias + " ON (" + alias + "." + join.field + " = " + modelsAlias + "." + this.pk(join.vql.model) + ")");
                var joinParam = this.getQueryParams(join.vql, modelsAlias);
                if (joinParam.fields) {
                    fields.push(joinParam.fields);
                }
                if (joinParam.condition) {
                    params.condition = params.condition ? "(" + params.condition + " AND " + joinParam.condition + ")" : joinParam.condition;
                }
                if (joinParam.orderBy) {
                    params.orderBy = params.orderBy ? params.orderBy + "," + joinParam.orderBy : joinParam.orderBy;
                }
                if (joinParam.join) {
                    joins.push(joinParam.join);
                }
            }
            params.join = joins.join('\n');
        }
        params.fields = fields.join(',');
        return params;
    };
    MySQL.prototype.getCondition = function (model, condition) {
        model = condition.model || model;
        var operator = this.getOperatorSymbol(condition.operator);
        if (!condition.isConnector) {
            return "(`" + model + "`." + condition.comparison.field + " " + operator + " " + (condition.comparison.isValueOfTypeField ? "`" + model + "`." + condition.comparison.value : "" + this.escape(condition.comparison.value)) + ")";
        }
        else {
            var childrenCondition = [];
            for (var i = 0; i < condition.children.length; i++) {
                var childCondition = this.getCondition(model, condition.children[i]).trim();
                childCondition && childrenCondition.push(childCondition);
            }
            var childrenConditionStr = childrenCondition.join(" " + operator + " ").trim();
            return childrenConditionStr ? "(" + childrenConditionStr + ")" : '';
        }
    };
    MySQL.prototype.getManyToManyRelation = function (list, query) {
        var _this = this;
        var ids = [];
        var runRelatedQuery = function (i) {
            var relationName = typeof query.relations[i] == 'string' ? query.relations[i] : query.relations[i]['name'];
            var relationship = _this.schemaList[query.model].getFields()[relationName].properties.relation;
            var fields = '*';
            if (typeof query.relations[i] != 'string') {
                for (var j = query.relations[i]['fields'].length; j--;) {
                    query.relations[i]['fields'][j] = "m." + query.relations[i]['fields'][j];
                }
                fields = query.relations[i]['fields'].join(',');
            }
            var leftKey = _this.camelCase(query.model);
            var rightKey = _this.camelCase(relationship.model.schema.name);
            return _this.query("SELECT " + fields + ",r." + leftKey + ",r." + rightKey + "  FROM `" + relationship.model.schema.name + "` m \n                LEFT JOIN `" + (query.model + 'Has' + _this.pascalCase(relationName)) + "` r \n                ON (m." + _this.pk(relationship.model.schema.name) + " = r." + rightKey + ") \n                WHERE r." + leftKey + " IN (" + ids.join(',') + ")")
                .then(function (relatedList) {
                var result = {};
                result[relationName] = relatedList;
                return result;
            });
        };
        for (var i = list.length; i--;) {
            ids.push(list[i][this.pk(query.model)]);
        }
        var relations = [];
        if (ids.length && query.relations && query.relations.length) {
            for (var i = query.relations.length; i--;) {
                var relationName = typeof query.relations[i] == 'string' ? query.relations[i] : query.relations[i]['name'];
                var relationship = this.schemaList[query.model].getFields()[relationName].properties.relation;
                if (relationship.type == Field_1.Relationship.Type.Many2Many) {
                    relations.push(runRelatedQuery(i));
                }
            }
        }
        if (!relations.length)
            return Promise.resolve(list);
        return Promise.all(relations)
            .then(function (data) {
            var leftKey = _this.camelCase(query.model);
            var rightKey = _this.camelCase(relationship.model.schema.name);
            for (var i = data.length; i--;) {
                for (var related in data[i]) {
                    if (data[i].hasOwnProperty(related)) {
                        for (var k = list.length; k--;) {
                            var id = list[k][_this.pk(query.model)];
                            list[k][related] = [];
                            for (var j = data[i][related].length; j--;) {
                                if (id == data[i][related][j][_this.camelCase(query.model)]) {
                                    var relatedData = data[i][related][j];
                                    relatedData[_this.pk(relationship.model.schema.name)] = relatedData[rightKey];
                                    delete relatedData[rightKey];
                                    delete relatedData[leftKey];
                                    list[k][related].push(relatedData);
                                }
                            }
                        }
                    }
                }
            }
            return list;
        });
    };
    MySQL.prototype.normalizeList = function (schema, list) {
        var fields = schema.getFields();
        for (var i = list.length; i--;) {
            for (var key in list[i]) {
                if (list[i].hasOwnProperty(key) &&
                    fields.hasOwnProperty(key) &&
                    fields[key].properties.type == Field_1.FieldType.Relation &&
                    fields[key].properties.relation.type != Field_1.Relationship.Type.Many2Many) {
                    list[i][key] = this.parseJson(list[i][key]);
                }
            }
        }
        return list;
    };
    MySQL.prototype.parseJson = function (str) {
        if (typeof str == 'string' && str) {
            var replace = ['\\n', '\\b', '\\r', '\\t', '\\v', "\\'"];
            var search = ['\n', '\b', '\r', '\t', '\v', '\''];
            for (var i = search.length; i--;) {
                str = str.replace(search[i], replace[i]);
            }
            var json;
            try {
                json = JSON.parse(str);
            }
            catch (e) {
                json = str;
            }
            return json;
        }
        else {
            return str;
        }
    };
    MySQL.prototype.createTable = function (schema) {
        var _this = this;
        var fields = schema.getFields();
        var createDefinition = this.createDefinition(fields, schema.name);
        var ownTablePromise = this.query("DROP TABLE IF EXISTS `" + schema.name + "`")
            .then(function () {
            return _this.query("CREATE TABLE `" + schema.name + "` (\n" + createDefinition.ownColumn + ")\n ENGINE=InnoDB DEFAULT CHARSET=utf8");
        });
        var translateTablePromise = Promise.resolve(true);
        if (createDefinition.lingualColumn) {
            translateTablePromise =
                this.query("DROP TABLE IF EXISTS " + schema.name + "_translation")
                    .then(function () {
                    return _this.query("CREATE TABLE " + schema.name + "_translation (\n" + createDefinition.lingualColumn + "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8");
                });
        }
        return function () { return Promise.all([ownTablePromise, translateTablePromise].concat(createDefinition.relations)); };
    };
    MySQL.prototype.relationTable = function (field, table) {
        var schema = new Schema_1.Schema(table + 'Has' + this.pascalCase(field.fieldName));
        schema.addField('id').primary().required();
        schema.addField(this.camelCase(table)).type(Field_1.FieldType.Integer).required();
        schema.addField(this.camelCase(field.properties.relation.model.schema.name)).type(Field_1.FieldType.Integer).required();
        return this.createTable(schema)();
    };
    MySQL.prototype.camelCase = function (str) {
        return str[0].toLowerCase() + str.slice(1);
    };
    MySQL.prototype.pascalCase = function (str) {
        return str[0].toUpperCase() + str.slice(1);
    };
    MySQL.prototype.qoute = function (str) {
        return "`" + str + "`";
    };
    MySQL.prototype.createDefinition = function (fields, table, checkMultiLingual) {
        if (checkMultiLingual === void 0) { checkMultiLingual = true; }
        var multiLingualDefinition = [];
        var columnDefinition = [];
        var relations = [];
        var keyIndex;
        for (var field in fields) {
            if (fields.hasOwnProperty(field)) {
                keyIndex = fields[field].properties.primary ? field : keyIndex;
                var column = this.columnDefinition(fields[field]);
                if (column) {
                    if (fields[field].properties.multilingual && checkMultiLingual) {
                        multiLingualDefinition.push(column);
                    }
                    else {
                        columnDefinition.push(column);
                    }
                }
                else if (fields[field].properties.type == Field_1.FieldType.Relation && fields[field].properties.relation.type == Field_1.Relationship.Type.Many2Many) {
                    relations.push(this.relationTable(fields[field], table));
                }
            }
        }
        var keyFiled;
        if (keyIndex) {
            keyFiled = fields[keyIndex];
        }
        else {
            keyFiled = new Field_1.Field('id');
            keyFiled.primary().type(Field_1.FieldType.Integer).required();
            columnDefinition.push(this.columnDefinition(keyFiled));
        }
        var keySyntax = "PRIMARY KEY (" + keyFiled.fieldName + ")";
        columnDefinition.push(keySyntax);
        if (multiLingualDefinition.length) {
            multiLingualDefinition.push(this.columnDefinition(keyFiled));
            multiLingualDefinition.push(keySyntax);
        }
        return {
            ownColumn: columnDefinition.join(' ,\n '),
            lingualColumn: multiLingualDefinition.join(' ,\n '),
            relations: relations
        };
    };
    MySQL.prototype.columnDefinition = function (filed) {
        var properties = filed.properties;
        if (properties.relation && properties.relation.type == Field_1.Relationship.Type.Many2Many) {
            return '';
        }
        var columnSyntax = "`" + filed.fieldName + "` " + this.getType(properties);
        var defaultValue = properties.type != Field_1.FieldType.Boolean ? "'" + properties.default + "'" : !!properties.default;
        columnSyntax += properties.required || properties.primary ? ' NOT NULL' : '';
        columnSyntax += properties.default ? " DEFAULT " + defaultValue : '';
        columnSyntax += properties.unique ? ' UNIQUE ' : '';
        columnSyntax += properties.primary ? ' AUTO_INCREMENT ' : '';
        return columnSyntax;
    };
    MySQL.prototype.getType = function (properties) {
        var typeSyntax;
        switch (properties.type) {
            case Field_1.FieldType.Boolean:
                typeSyntax = "TINYINT(1)";
                break;
            case Field_1.FieldType.EMail:
            case Field_1.FieldType.File:
            case Field_1.FieldType.Password:
            case Field_1.FieldType.Tel:
            case Field_1.FieldType.URL:
            case Field_1.FieldType.String:
                if (!properties.primary) {
                    typeSyntax = "VARCHAR(" + (properties.maxLength ? properties.maxLength : 255) + ")";
                }
                else {
                    typeSyntax = 'BIGINT';
                }
                break;
            case Field_1.FieldType.Float:
            case Field_1.FieldType.Number:
                typeSyntax = "DECIMAL(" + (properties.max ? properties.max.toString().length : 10) + ",10)";
                break;
            case Field_1.FieldType.Enum:
            case Field_1.FieldType.Integer:
                typeSyntax = "INT(" + (properties.max ? properties.max.toString(2).length : 20) + ")";
                break;
            case Field_1.FieldType.Object:
                typeSyntax = "BLOB";
                break;
            case Field_1.FieldType.Text:
                typeSyntax = "TEXT";
                break;
            case Field_1.FieldType.Timestamp:
                typeSyntax = 'BIGINT';
                break;
            case Field_1.FieldType.Relation:
                if (properties.relation.type == Field_1.Relationship.Type.One2One || properties.relation.type == Field_1.Relationship.Type.One2Many) {
                    typeSyntax = 'BIGINT';
                }
                break;
        }
        return typeSyntax;
    };
    MySQL.prototype.initializeDatabase = function () {
        return this.query("ALTER DATABASE `" + this.config.database + "`  CHARSET = utf8 COLLATE = utf8_general_ci;");
    };
    MySQL.prototype.getOperatorSymbol = function (operator) {
        switch (operator) {
            // Connectors
            case Vql_1.Condition.Operator.And:
                return 'AND';
            case Vql_1.Condition.Operator.Or:
                return 'OR';
            // Comparison
            case Vql_1.Condition.Operator.EqualTo:
                return '=';
            case Vql_1.Condition.Operator.NotEqualTo:
                return '<>';
            case Vql_1.Condition.Operator.GreaterThan:
                return '>';
            case Vql_1.Condition.Operator.GreaterThanOrEqualTo:
                return '>=';
            case Vql_1.Condition.Operator.LessThan:
                return '<';
            case Vql_1.Condition.Operator.LessThanOrEqualTo:
                return '<=';
            case Vql_1.Condition.Operator.Like:
                return 'LIKE';
            case Vql_1.Condition.Operator.NotLike:
                return 'NOT LIKE';
        }
    };
    MySQL.prototype.addOneToManyRelation = function (model, relation, value) {
        var _this = this;
        var result = {};
        var modelName = model.constructor['schema'].name;
        var fields = this.schemaList[modelName].getFields();
        var relatedModelName = fields[relation].properties.relation.model.schema.name;
        var readIdPromise;
        if (fields[relation].properties.relation.isWeek && typeof value == 'object' && !value[this.pk(relatedModelName)]) {
            var relatedObject = new fields[relation].properties.relation.model(value);
            readIdPromise = relatedObject.insert().then(function (result) {
                return result.items[0][_this.pk(relatedModelName)];
            });
        }
        else {
            var id;
            if (+value) {
                id = +value;
            }
            else if (typeof value == 'object') {
                id = +value[this.pk(relatedModelName)];
            }
            if (!id || id <= 0)
                return Promise.reject(new Error("invalid <<" + relation + ">> related model id"));
            readIdPromise = Promise.resolve(id);
        }
        return readIdPromise
            .then(function (id) {
            return _this.query("UPDATE `" + modelName + "` SET `" + relation + "` = '" + id + "' WHERE " + _this.pk(relatedModelName) + "='" + model[_this.pk(relatedModelName)] + "' ");
        })
            .then(function (updateResult) {
            result.items = updateResult;
            return result;
        })
            .catch(function (err) {
            return Promise.reject(new Err_1.Err(Err_1.Err.Code.DBUpdate, err && err.message));
        });
    };
    MySQL.prototype.addManyToManyRelation = function (model, relation, value) {
        var _this = this;
        var result = {};
        var modelName = model.constructor['schema'].name;
        var fields = this.schemaList[modelName].getFields();
        var relatedModelName = fields[relation].properties.relation.model.schema.name;
        var newRelation = [];
        var relationIds = [];
        if (+value > 0) {
            relationIds.push(+value);
        }
        else if (value instanceof Array) {
            for (var i = value['length']; i--;) {
                if (+value[i]) {
                    relationIds.push(+value[i]);
                }
                else if (value[i] && typeof value[i] == 'object') {
                    if (+value[i][this.pk(relatedModelName)])
                        relationIds.push(+value[i][this.pk(relatedModelName)]);
                    else if (fields[relation].properties.relation.isWeek)
                        newRelation.push(value[i]);
                }
            }
        }
        else if (typeof value == 'object') {
            if (+value[this.pk(relatedModelName)]) {
                relationIds.push(+value[this.pk(relatedModelName)]);
            }
            else if (fields[relation].properties.relation.isWeek)
                newRelation.push(value);
        }
        return Promise.resolve()
            .then(function () {
            if (!newRelation.length) {
                return relationIds;
            }
            return _this.insertAll(relatedModelName, newRelation)
                .then(function (result) {
                for (var i = result.items.length; i--;) {
                    relationIds.push(result.items[i][_this.pk(relatedModelName)]);
                }
                return relationIds;
            });
        })
            .then(function (relationIds) {
            if (!relationIds || !relationIds.length) {
                result.items = [];
                return result;
            }
            var insertList = [];
            for (var i = relationIds.length; i--;) {
                insertList.push("(" + model[_this.pk(modelName)] + "," + relationIds[i] + ")");
            }
            return _this.query("INSERT INTO " + modelName + "Has" + _this.pascalCase(relation) + "\n                    (`" + _this.camelCase(modelName) + "`,`" + _this.camelCase(relatedModelName) + "`) VALUES " + insertList.join(','))
                .then(function (insertResult) {
                result.items = insertResult;
                return result;
            });
        })
            .catch(function (err) {
            return Promise.reject(new Err_1.Err(Err_1.Err.Code.DBInsert, err && err.message));
        });
    };
    MySQL.prototype.removeOneToManyRelation = function (model, relation) {
        var _this = this;
        var modelName = model.constructor['schema'].name;
        var result = {};
        var relatedModelName = this.schemaList[modelName].getFields()[relation].properties.relation.model.schema.name;
        var isWeek = this.schemaList[modelName].getFields()[relation].properties.relation.isWeek;
        var preparePromise = Promise.resolve(0);
        if (isWeek) {
            var readRelationId = +model[relation] ? Promise.resolve(+model[relation]) : this.findById(modelName, model[this.pk(modelName)]).then(function (result) { return result.items[0][relation]; });
            readRelationId.then(function (relationId) {
                return _this.deleteOne(relatedModelName, relationId).then(function () { return relationId; });
            });
        }
        return preparePromise
            .then(function () {
            return _this.query("UPDATE `" + model + "` SET " + relation + " = 0 WHERE " + _this.pk(modelName) + " = " + _this.escape(model[_this.pk(modelName)]))
                .then(function (updateResult) {
                result.items = updateResult;
                return result;
            });
        })
            .catch(function (err) {
            return Promise.reject(new Err_1.Err(Err_1.Err.Code.DBUpdate, err && err.message));
        });
    };
    MySQL.prototype.removeManyToManyRelation = function (model, relation, condition) {
        var _this = this;
        var modelName = model.constructor['schema'].name;
        var relatedModelName = this.schemaList[modelName].getFields()[relation].properties.relation.model.schema.name;
        var isWeek = this.schemaList[modelName].getFields()[relation].properties.relation.isWeek;
        var preparePromise;
        if (condition) {
            var vql = new Vql_1.Vql(relatedModelName);
            vql.select(this.pk(relatedModelName)).where(condition);
            preparePromise = this.findByQuery(vql);
        }
        else {
            preparePromise = Promise.resolve();
        }
        return preparePromise
            .then(function (result) {
            var conditions = [];
            var conditionsStr;
            var relatedField = _this.camelCase(relatedModelName);
            if (result && result.items.length) {
                for (var i = result.items.length; i--;) {
                    result.items.push(+result.items[0][_this.pk(relatedModelName)]);
                    conditions.push(relatedField + " = '" + +result.items[0][_this.pk(relatedModelName)] + "'");
                }
            }
            else if (result) {
                conditions.push('FALSE');
            }
            conditionsStr = conditions.length ? " AND " + conditions.join(' OR ') : '';
            return _this.query("SELECT * FROM " + (model + 'Has' + _this.pascalCase(relation)) + " WHERE " + _this.camelCase(modelName) + " = " + model[_this.pk(modelName)] + " " + conditionsStr)
                .then(function (items) {
                var ids = [];
                for (var i = items.length; i--;) {
                    ids.push(items[i][relatedField]);
                }
                return ids;
            });
        })
            .then(function (ids) {
            var relatedField = _this.camelCase(relatedModelName);
            var idConditions = [];
            var condition = new Vql_1.Condition(Vql_1.Condition.Operator.Or);
            for (var i = ids.length; i--;) {
                idConditions.push(relatedField + " = '" + +ids[i] + "'");
                condition.append(new Vql_1.Condition(Vql_1.Condition.Operator.EqualTo).compare('id', ids[i]));
            }
            var idCondition = ids.length ? "(" + ids.join(' OR ') + ")" : 'FALSE';
            return _this.query("DELETE FROM " + (model + 'Has' + _this.pascalCase(relation)) + " WHERE " + _this.camelCase(modelName) + " = " + model[_this.pk(modelName)] + " AND " + idCondition + "}")
                .then(function () {
                var result = { items: ids };
                if (isWeek && ids.length) {
                    return _this.deleteAll(relatedModelName, condition).then(function () { return result; });
                }
                return result;
            });
        });
    };
    MySQL.prototype.escape = function (value) {
        if (typeof value == 'number')
            return value;
        if (typeof value == 'boolean')
            return value ? 1 : 0;
        return this.connection.escape(value);
    };
    MySQL.prototype.query = function (query) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connection.query(query, function (err, result) {
                if (err)
                    return reject(err);
                resolve(result);
            });
        });
    };
    return MySQL;
}(Database_1.Database));
exports.MySQL = MySQL;
