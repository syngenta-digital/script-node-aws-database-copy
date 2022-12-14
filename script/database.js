const copyDDBTable = require('copy-dynamodb-table').copy;

const copyDDB = (params) => {
    return new Promise((resolve, reject) => {
        copyDDBTable(params, function (err, result) {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
};

exports.copy = async (event) => {
    console.log(`\n===== copying ${event.source} -> ${event.destination} =====\n`);
    const engines = ['dynamodb'];
    if (!engines.includes(event.engine)) {
        throw Error(`engine ${event.engine}... yet; only supported engines are ${engines.join(', ')}`);
    }
    if (event.engine === 'dynamodb') {
        await copyDDB({
            config: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || event.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || event.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN || event.AWS_SESSION_TOKEN,
                region: event.region
            },
            source: {
                tableName: event.source
            },
            destination: {
                tableName: event.destination
            },
            log: true
        });
    }
};
