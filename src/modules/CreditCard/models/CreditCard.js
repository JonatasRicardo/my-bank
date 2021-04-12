const mongoose = require('mongoose');

const schema = mongoose.Schema({
    number: Number,
    deadLine: Date,
    cvv: Number,
    emissionDate: Date,
    closingDate: Number,
    credit: Number,
    compras: [{
       value: Number,
       date: Date,
       description: String,
       category: String
    }]
});

export default mongoose.model('creditCard', schema, 'creditCard');
