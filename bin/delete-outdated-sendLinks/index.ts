import { QueryTypes } from 'sequelize';
import { Command } from 'commander';

import Database from '../../src/config/initializers/database';

type CommandOptions = {
  dbHostname: string;
  dbPort: string;
  dbName: string;
  dbUsername: string;
  dbPassword: string;
};

const commands: { flags: string; description: string; required: boolean }[] = [
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
];

const command = new Command('delete-outdated-sendLinks').version('0.0.1');

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

function finishProgram() {
  db.close()
    .then(() => {
      console.log('DISCONNECTED FROM DB');
    })
    .catch((err) => {
      console.log('Error closing connection %s. %s', err.message.err.stack || 'NO STACK.');
    });
}
process.on('SIGINT', () => finishProgram());

interface DeleteSendLinkItem {
  file_id: string;
  user_id: number;
  folder_id: number;
  bucket: string;
  id: string;
};

async function start() {
  const BUCKET = 'GET BUCKET';
  const outdatedLinksIds = await db.query('SELECT DISTINCT(id) AS id FROM send_links WHERE expiration_at<=NOW()',
    { type: QueryTypes.SELECT }) as unknown as string[];
  const outdatedSendLinkItems = await db.query(`
    SELECT network_id AS "file_id", -1 AS "user_id", -1 AS "folder_id", ${BUCKET} AS "bucket", id
    FROM send_links_items
    WHERE type='file' AND link_id IN (${outdatedLinksIds.join('\',\'')})`, { type: QueryTypes.SELECT });

  outdatedSendLinkItems.forEach((sendLinkitem) => {
    db.query(`INSERT INTO deleted_files (file_id, user_id, folder_id, bucket) VALUES (
      '${(sendLinkitem as DeleteSendLinkItem).file_id}', ${(sendLinkitem as DeleteSendLinkItem).user_id},
      ${(sendLinkitem as DeleteSendLinkItem).folder_id}, '${(sendLinkitem as DeleteSendLinkItem).bucket}')`,
      { type: QueryTypes.INSERT });
    db.query(`DELETE FROM send_links_items WHERE id=${(sendLinkitem as DeleteSendLinkItem).id}`,
      { type: QueryTypes.DELETE });
  });

  outdatedLinksIds.forEach((outdatedLinkId) => {
    db.query(`DELETE FROM send_links WHERE id=${outdatedLinkId}`, { type: QueryTypes.DELETE });
  });
}

start()
  .catch((err) => {
    console.log('err', err);
  })
  .finally(() => {
    finishProgram();
  });
