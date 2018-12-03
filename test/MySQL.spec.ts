import {MySQL} from "../src/MySQL";
import {config, models} from "./common";

describe('Testing connection', function () {
    var database:MySQL;
    beforeEach(function () {
        database = new MySQL(config, models);
    });
    afterEach(function (done) {
        database.closePool().then(()=>done());
    });
    
    it('it should connect to database', function (done) {
        database.connect()
            .then((db) => {
                expect(db).toEqual(database);
                done();
            })
            .catch(err => done.fail(err.message))
    })

    it('it should release a connection to pool', function (done) {
        database.connect().then(() => {
            database.getConnection().then(connection=>{
                database.close(connection)
                    .then((result) => {
                        expect(result).toBeTruthy();
                        expect(connection).toBeTruthy();
                        done();
                    })
                    .catch(err => done.fail(err.message))
            })    
        })
    });

    it('it should close the pool connection', function (done) {
        database.connect().then(db => {
            db.closePool()
                .then((result) => {
                    expect(result).toBeTruthy();
                    done();
                })
        })
    });
    
})

describe('Testing queries', function () {
    var database;
    beforeEach(function (done) {
        database = new MySQL(config, models);
        database.connect().then((db)=>done());
    });
    afterEach(function (done) {
        database.closePool().then(()=>done());
    });

    it ("it shoud execute a select 1 + 1 as result",function (done) {
        database.query('SELECT 1 + 1 AS solution').then(result=>{
            expect(result[0].solution).toBe(2);
            done()
        })
    })

})