const AWS = require('aws-sdk');
const copyDDBTable = require('copy-dynamodb-table').copy;

const copyDDB = (params) => {
    return new Promise((resolve, reject) => {
        copyDDBTable(params, function (err, result) {
            resolve(result);
        });
    });
};

exports.copyTable = async (event) => {
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
    console.log(`\n===== copying stack matching ${event.source_pattern} =====\n`);
    const regex = new RegExp(event.source_pattern);
    const lambda = new AWS.Lambda();
    const ddb = new AWS.DynamoDB();
    const tables = await ddb.listTables().promise();
    for (const tableName of tables.TableNames) {
        if (regex.test(tableName)) {
            const destination = tableName.replace(event.source_pattern, event.destination_prefix);
            console.log(`Invoking Lambda to Copy: ${tableName} -> ${destination}`);
            const params = {
                FunctionName: 'v1-console-database-copy-db',
                InvocationType: 'Event',
                LogType: 'Tail',
                Payload: new Buffer(
                    JSON.stringify({engine: 'dynamodb', source: tableName, destination: destination}),
                    'utf-8'
                )
            };
            await lambda.invoke(params).promise();
        }
    }
};
