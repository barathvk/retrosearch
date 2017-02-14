const db = require('then-levelup')(require('levelup')('games', {db: require('redisdown'), host: config.redis.host, port: config.redis.port, valueEncoding: 'json'}))
const exists = require('level-exists')
const igdb = require('igdb-api-node')
const slug = require('slug')
const search = require('./search')
exists.install(db)
const q = require('q')
const metadata = async id => {
  try {
    const gbd = await igdb.games({
      limit: 1,
      fields: '*',
      search: id.replace(/_/g, ' ')
    })
    const gbdd = gbd.body[0]
    return gbdd
  } catch (err) {
    logger.warn(`[${id} ${err.message}`)
  }
}
const index = async data => {
  const _id = slug(`${data.console}_${data.title}`, {
    replacement: '_',
    symbols: false,
    remove: /[()]/g,
    lower: true
  })
  db.exists(_id, async (err, exists) => {
    if (err) {
      logger.error(err)
    } else if (!exists) {
      await db.put(_id, data)
      search.add(_id, data)
      logger.debug(`[${data.console}] ${data.title} added`)
    } else {
      logger.debug(`${_id} already exists`)
    }
  })
}
const remove = async p => {
  const title = _.last(p.split('/')).split('.')[0]
  const system = p.split('/')[p.split('/').length - 2]
  const id = slug(`${system}_${title}`, {
    replacement: '_',
    symbols: false,
    remove: /[()]/g,
    lower: true
  })
  await db.del(id)
  logger.debug(`[${system}] ${title} removed`)
}
const list = () => {
  const def = q.defer()
  const d = {}
  const rs = db.createReadStream({keys: true, values: true})
  rs.on('data', dd => {
    d[dd.key] = dd.value
  }).on('end', () => {
    def.resolve(d)
  }).on('error', err => {
    def.reject(err)
  })
  return def.promise
}
const get = async id => {
  const d = await db.get(id)
  return d
}
module.exports = {
  index,
  remove,
  list,
  get,
  metadata,
  db
}
