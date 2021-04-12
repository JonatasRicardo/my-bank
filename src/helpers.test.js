import 'babel-polyfill';
import mongoose from 'mongoose';

mongoose.Promise = global.Promise;

const testDatabase = `testDatabase${process.env.npm_package_name}${Math.floor(Math.random() * Date.now())}`;

before(function (done) {
    mongoose.connect(`mongodb://10.99.96.156:25017/${testDatabase}`, { useMongoClient: true }, (err) => {
        if (err) {
            console.error.bind(console, 'connection error')
        }
        console.log('[MongoDB]', 'Conectado!');
        done();
    });
});

after(function(done){
    mongoose.connection.db.dropDatabase(function(){
        mongoose.connection.close(done);
    });
});