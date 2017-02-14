const slug = require('slug')
const es = require('elasticsearch')
const client = new es.Client({ host: config.es })
const index = async data => {
  const _id = slug(`${data.console}_${data.title}`, {
    replacement: '_',
    symbols: false,
    remove: /[()]/g,
    lower: true
  })
  const ixex = await client.indices.exists({index: 'games'})
  if (!ixex) await client.indices.create({index: 'games'})
  await client.index({
    index: 'games',
    type: data.console,
    id: _id,
    body: data
  })
  logger.debug(`[${data.console}] ${data.title} added`)
}
const get = async (type, id) => {
  const d = await client.get({index: 'games', id, type})
  return d
}
module.exports = {
  index,
  get
}
