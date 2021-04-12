import chai, { assert, expect, use } from 'chai';
import chaiEach from "chai-each";
import mongooseListFilterPagination from './';
import mongoose from 'mongoose';

const modelTest =  mongoose.model('teste', mongoose.Schema({
    campo1: String,
    campo2: String,
    campo3: String,
    campo4: String,
    value: Number,
}));

const mockTest = (i) => ({
    campo1: `campo1_${i}`,
    campo2: `campo2_${i}`,
    campo3: `campo3_${i}`,
    campo4: `campo4_${i}`,
    value: i,
});

const allowedFields = {
    campo1: val => new RegExp(val, 'y'),
    campo2: val => new RegExp(val, 'y'),
    campo3: val => new RegExp(val, 'y'),
    campo4: val => new RegExp(val, 'y'),
    value: val => val,
};

describe('mongooseListFilterPagination', async function() {
    before(function (done) {
        modelTest.insertMany([mockTest(1),mockTest(2),mockTest(3),mockTest(7),mockTest(0)]).then(() => {
            done();
        });
    });

    it('return pagination structure', async function() {
        const testList = await mongooseListFilterPagination({
            fields: '*',
            limit: 5,
            skip: 0,
            filter: '',
            order: 'asc',
            orderby: '',
            allowedFields,
            mongooseModel: modelTest,
        })
        expect(testList).have.keys(['data', 'limit', 'offset', 'total']);
        assert.isArray(testList.data);
        assert.isNumber(testList.limit);
        assert.isNumber(testList.offset);
        assert.isNumber(testList.total);
    });

    it('return all fields when the "fields" parameter is "*" ', async function() {
        const testList = await mongooseListFilterPagination({
            fields: '*',
            limit: 5,
            skip: 0,
            filter: '',
            order: 'asc',
            orderby: '',
            allowedFields,
            mongooseModel: modelTest,
        });
        expect(testList.data).each.to.have.property('campo1');
        expect(testList.data).each.to.have.property('campo2');
        expect(testList.data).each.to.have.property('campo3');
        expect(testList.data).each.to.have.property('campo4');
        expect(testList.data).each.to.have.property('value');
        expect(testList.data).each.to.have.property('_id');
    });

    it('return only the specified fields when the "fields" parameter is "campo1,campo2" ', async function() {
        const testList = await mongooseListFilterPagination({
            fields: 'campo1,campo2',
            limit: 5,
            skip: 0,
            filter: '',
            order: 'asc',
            orderby: '',
            allowedFields,
            mongooseModel: modelTest,
        });
        expect(testList.data).each.to.have.property('campo1');
        expect(testList.data).each.to.have.property('campo2');
        expect(testList.data).each.to.not.have.property('campo3');
        expect(testList.data).each.to.not.have.property('campo4');
        expect(testList.data).each.to.not.have.property('value');
        expect(testList.data).each.to.have.property('_id');
    });

    it('return only 2 items when the "limit" parameter is "2"', async function() {
        const testList = await mongooseListFilterPagination({
            fields: '*',
            limit: 2,
            skip: 0,
            filter: '',
            order: 'asc',
            orderby: '',
            allowedFields,
            mongooseModel: modelTest,
        });
        assert.isArray(testList.data);
        expect(testList.data).to.have.length(2);
    });

    it('skip 2 items when the "skip" parameter is "2"', async function() {
        const testList = await mongooseListFilterPagination({
            fields: '*',
            limit: 2,
            skip: 2,
            filter: '',
            order: 'asc',
            orderby: '',
            allowedFields,
            mongooseModel: modelTest,
        });

        expect(testList.data[0].campo1).to.be.equal('campo1_3');
    });

    it('Ordering asc', async function() {
        const testList = await mongooseListFilterPagination({
            fields: '*',
            limit: 5,
            skip: 0,
            filter: '',
            order: 'asc',
            orderby: 'value',
            allowedFields,
            mongooseModel: modelTest,
        });

        expect(testList.data[0].value).to.be.equal(0);
        expect(testList.data[1].value).to.be.equal(1);
        expect(testList.data[2].value).to.be.equal(2);
        expect(testList.data[3].value).to.be.equal(3);
        expect(testList.data[4].value).to.be.equal(7);
    });

    it('Ordering desc', async function() {
        const testList = await mongooseListFilterPagination({
            fields: '*',
            limit: 5,
            skip: 0,
            filter: '',
            order: 'desc',
            orderby: 'value',
            allowedFields,
            mongooseModel: modelTest,
        });

        expect(testList.data[0].value).to.be.equal(7);
        expect(testList.data[1].value).to.be.equal(3);
        expect(testList.data[2].value).to.be.equal(2);
        expect(testList.data[3].value).to.be.equal(1);
        expect(testList.data[4].value).to.be.equal(0);
    });

    it('return only the "allowed Fields" fields when the "fields" parameter is "*" ', async function() {
        const testList = await mongooseListFilterPagination({
            fields: '*',
            limit: 5,
            skip: 0,
            filter: '',
            order: 'asc',
            orderby: '',
            allowedFields: {
                campo1: val => new RegExp(val, 'y'),
                value: val => val,
            },
            mongooseModel: modelTest,
        });
        expect(testList.data).each.to.have.property('campo1');
        expect(testList.data).each.to.not.have.property('campo2');
        expect(testList.data).each.to.not.have.property('campo3');
        expect(testList.data).each.to.not.have.property('campo4');
        expect(testList.data).each.to.have.property('value');
        expect(testList.data).each.to.have.property('_id');
    });

    it('return only the results that satisfy the "filter" parameter', async function() {
        const testList = await mongooseListFilterPagination({
            fields: '*',
            limit: 5,
            skip: 0,
            filter: 'campo1:campo1_1',
            order: 'asc',
            orderby: '',
            allowedFields: {
                campo1: val => new RegExp(val, 'y'),
                value: val => val,
            },
            mongooseModel: modelTest,
        });
        expect(testList.data).each.to.have.property('campo1').that.is.equal('campo1_1');
    });
    
    after(function(done){
        mongoose.connection.db.dropCollection('teste', function() {
            done();
        });
    });
    
});
