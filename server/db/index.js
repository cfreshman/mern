const { MongoClient } = require('mongodb');

let client;

function connect(url, callback) {
    if (client) callback();

    MongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, (err, result) => {
        client = result;
        callback(err);
    });
}

function get() {
    return client.db();
}

function collection(name) {
    return client.db().collection(name);
}

function close(callback=()=>{}) {
    if (!client) callback();

    client.close(err => {
        client = null;
        callback(err);
    });
}

module.exports = {
    connect,
    get,
    collection,
    close
}