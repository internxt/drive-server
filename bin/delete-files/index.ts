import { Command } from 'commander';

import Database from '../../src/config/initializers/database';
import initFileModel from '../../src/app/models/file';
import { createTimer, deleteFiles, DeleteFilesResponse, getFilesToDelete, signToken } from './utils';

type CommandOptions = {
    secret: string;
    dbHostname: string;
    dbPort: string;
    dbName: string;
    dbUsername: string;
    dbPassword: string;
    concurrency?: string;
    limit?: string;
    endpoint: string;
};

const commands: { flags: string; description: string; required: boolean }[] = [
    {
        flags: '-s, --secret <token_secret>',
        description: 'The secret used to sign the token to request files deletion',
        required: true,
    },
    {
        flags: '--db-hostname <database_hostname>',
        description: 'The hostname of the database where deleted files are stored',
        required: true,
    },
    {
        flags: '--db-name <database_name>',
        description: 'The name of the database where deleted files are stored',
        required: true,
    },
    {
        flags: '--db-username <database_username>',
        description: 'The username authorized to read and delete from the deleted files table',
        required: true,
    },
    {
        flags: '--db-password <database_password>',
        description: 'The database username password',
        required: true,
    },
    {
        flags: '--db-port <database_port>',
        description: 'The database port',
        required: true,
    },
    {
        flags: '-c, --concurrency <concurrency>',
        description: 'The concurrency level of the requests that will be made',
        required: false,
    },
    {
        flags: '-l, --limit <limit>',
        description: 'The files limit to handle each time',
        required: false,
    },
    {
        flags: '-e, --endpoint <endpoint>',
        description: 'The API endpoint where the delete files requests are sent',
        required: true,
    },
];

const command = new Command('delete-files').version('2.0.0');

commands.forEach((c) => {
    if (c.required) {
        command.requiredOption(c.flags, c.description);
    } else {
        command.option(c.flags, c.description);
    }
});

command.parse();

const opts: CommandOptions = command.opts();
const db = Database.getInstance({
    sequelizeConfig: {
        host: opts.dbHostname,
        port: opts.dbPort,
        database: opts.dbName,
        username: opts.dbUsername,
        password: opts.dbPassword,
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    },
});

const timer = createTimer();
timer.start();

let totalFilesRemoved = 0;
let totalRequests = 0;
let failedRequests = 0;

const logIntervalId = setInterval(() => {
    console.log(
        'DELETION RATE: %s/s | FAILURE RATE %s%',
        totalFilesRemoved / (timer.end() / 1000),
        (failedRequests / totalRequests) * 100,
    );
}, 10000);

function finishProgram() {
    clearInterval(logIntervalId);

    console.log('TOTAL FILES REMOVED %s | DURATION %ss', totalFilesRemoved, (timer.end() / 1000).toFixed(2));
    db.close()
        .then(() => {
            console.log('DISCONNECTED FROM DB');
        })
        .catch((err) => {
            console.log('Error closing connection %s. %s', err.message.err.stack || 'NO STACK.');
        });
}

function getDateOneMonthAgo() {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    
    oneMonthAgo.setMonth(today.getMonth() - 1);
  
    return oneMonthAgo;
}

process.on('SIGINT', () => finishProgram());

let lastId = 2147483647;
let deletedSize = 0;

async function start(limit = 20, concurrency = 5) {
    const fileModel = initFileModel(db);
    let fileIds: string[] = [];
    const startDate = getDateOneMonthAgo();

    console.log('Starting date set at', startDate);

    do {
        const files = await getFilesToDelete(
            fileModel, 
            limit, 
            startDate,
            lastId
        );

        console.log('files to delete %s', files.map((f) => f.id));

        fileIds = files.map((f) => f.fileId);

        const promises: Promise<DeleteFilesResponse>[] = [];
        const chunksOf = Math.ceil(limit / concurrency);

        console.time('df-network-req');

        for (let i = 0; i < fileIds.length; i += chunksOf) {
            promises.push(deleteFiles(opts.endpoint, fileIds.slice(i, i + chunksOf), signToken('5m', opts.secret)));
        }

        const results = await Promise.allSettled(promises);

        console.timeEnd('df-network-req');

        const filesIdsToRemove = results
            .filter((r) => r.status === 'fulfilled')
            .flatMap((r) => (r as PromiseFulfilledResult<DeleteFilesResponse>).value.message.confirmed);

        totalRequests += results.length;
        failedRequests += results.filter((r) => r.status === 'rejected').length;

        const deletedFilesToDelete = files.filter((f) => {
            return filesIdsToRemove.some((fId) => fId === f.fileId);
        });

        if (deletedFilesToDelete.length === 0) {
            console.warn('Something not going fine, no files deleted');
            lastId = Infinity;
        } else {
            lastId = deletedFilesToDelete.sort((a, b) => a.id - b.id)[0].id;
        }

        totalFilesRemoved += deletedFilesToDelete.length;
        deletedSize += deletedFilesToDelete.reduce((acc, curr) => acc + parseInt(curr.size.toString()), 0);

        console.log('Deleted bytes', deletedSize);
    } while (fileIds.length === limit);
}

start(parseInt(opts.limit || '20'), parseInt(opts.concurrency || '5'))
    .catch((err) => {
        console.log('err', err);
    })
    .finally(() => {
        console.log('Deleted bytes', deletedSize);
        console.log('lastId was', lastId);
        finishProgram();
    });
