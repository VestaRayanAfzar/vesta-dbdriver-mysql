"use strict";
var MySQL_1 = require("../src/MySQL");
var common_1 = require("./common");
describe('Connection Test', function () {
    var database;
    beforeEach(function () {
        database = new MySQL_1.MySQL(common_1.config, common_1.models);
    });
    describe("connect to database test", function () {
        it('it should connect to database', function (done) {
            database.connect()
                .then(function (db) {
                expect(db).toEqual(database);
                done();
            })
                .catch(function (err) { return done(err.message); });
        });
    });
    describe('end connection', function () {
        it('it should end the connection', function (done) {
            database.connect().then(function (db) {
                database.close()
                    .then(function (result) {
                    expect(result).toBeTruthy();
                    done();
                })
                    .catch(function (err) { return done(err.message); });
            });
        });
    });
    describe('destroy connection', function () {
        it('it should destroy the connection', function (done) {
            database.connect().then(function (db) {
                database.close(true)
                    .then(function (result) {
                    expect(result).toBeTruthy();
                    done();
                })
                    .catch(function (err) { return done(err.message); });
            });
        });
    });
});
