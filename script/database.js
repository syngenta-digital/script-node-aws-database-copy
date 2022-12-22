const AWS = require('aws-sdk');
const copyDDBTable = require('copy-dynamodb-table').copy;

const copyDDB = (params) => {
    return new Promise((resolve, reject) => {
        copyDDBTable(params, function (err, result) {
            resolve(result);
        });
    });
};

exports.copyDatabase = async (event) => {
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

exports.copyStack = async (event) => {
    console.log(`\n===== copying stack matching ${event.source_prefix} =====\n`);
    const regex = new RegExp(event.source_prefix);
    const lambda = new AWS.Lambda();
    const ddb = new AWS.DynamoDB();
    const tables = await ddb.listTables().promise();
    for (const tableName of tables.TableNames) {
        if (regex.test(tableName)) {
            const destination = tableName.replace(event.source_prefix, event.destination_prefix);
            console.log(`Invoking Lambda to Copy: ${tableName} -> ${destination}`);
            const params = {
                FunctionName: 'v1-console-database-copy-db',
                InvocationType: 'Event',
                Payload: JSON.stringify({engine: event.engine, source: tableName, destination: destination})
            };
            await lambda.invoke(params).promise();
        }
    }
};
