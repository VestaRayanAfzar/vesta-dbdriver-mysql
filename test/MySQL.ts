import {MySQL} from "../package/MySQL";
import {config, models} from "./common";

describe('Connection Test', function () {
    var database;
    beforeEach(function () {
        database = new MySQL(config, models);
    });
    describe("connect to database test", function () {
        it('it should connect to database', function (done) {
            database.connect()
                .then((db)=> {
                    expect(db).toEqual(database);
                    done();
                })
                .catch(err=>done(err.message))
        })
    });
    describe('end connection', function () {
        it('it should end the connection', function (done) {
            database.connect().then(db=> {
                database.close()
                    .then((result)=> {
                        expect(result).toBeTruthy();
                        done();
                    })
                    .catch(err=>done(err.message))
            })
        });
    });

    describe('destroy connection', function () {
        it('it should destroy the connection', function (done) {
            database.connect().then(db=> {
                database.close(true)
                    .then((result)=> {
                        expect(result).toBeTruthy();
                        done();
                    })
                    .catch(err=>done(err.message))
            })
        });
    });
});
