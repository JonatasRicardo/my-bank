const mongoose = require('mongoose');

const schema = mongoose.Schema({
    deadLine: Date,
    paymentDate: Date,
    value: {
        type: Number,
        enum: [15,30,50,60,100]
    },
    number: Number,
    operator: {
        type: String,
        enum: ['vivo', 'claro', 'tim', 'oi', 'nextel']
    }
});

export default mongoose.model('phoneCredit', schema, 'phoneCredit');
