const copy = require('copy-dynamodb-table').copy;


const promiseCopy = (arguments) => {
    return new Promise((resolve, reject) => {
        copy(arguments, function (err, result) {
            if (err) {
                return reject(err);
            }
            resolve(result);
        })
    })
}

const copy = async (event) => {
    console.log(`\n===== copying ${event.source} -> ${event.destination} =====\n`);
    await promiseCopy({
        config: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN,
            region: event.region
        },
        source: {
            tableName: event.source,
        },
        destination: {
            tableName: event.destination,
        },
        log: true
    });
}
