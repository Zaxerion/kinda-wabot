import Helper from './helper.js'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { cloudDBAdapter, mongoDB, mongoDBV2 } from './DB_Adapters/index.js'
import lodash from 'lodash'

const databaseUrl = global.db || ''
let source = ''

const databaseAdapter = /https?:\/\//.test(databaseUrl)
  ? (source = 'CloudDB', new cloudDBAdapter(databaseUrl))
  : /mongodb(\+srv)?:\/\//i.test(databaseUrl)
    ? (Helper.opts['mongodbv2']
        ? (source = 'MongoDB v2', new mongoDBV2(databaseUrl))
        : (source = 'MongoDB', new mongoDB(databaseUrl)))
    : (source = 'Local JSON', new JSONFile(`${Helper.opts._[0] ? Helper.opts._[0] + '_' : ''}database.json`))

let database = new Low(databaseAdapter)

loadDatabase()

async function loadDatabase() {
  if (database._read) await database._read
  if (database.data !== null) return database.data

  database._read = database.read().catch(console.error)
  await database._read

  console.log(`- Database loaded from: ${source} -`)

  database.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    lid: {},
    ...(database.data || {})
  }
  database.chain = lodash.chain(database.data)
  return database.data
}

export {
  databaseUrl,
  databaseAdapter,
  database,
  loadDatabase
}

export default database
