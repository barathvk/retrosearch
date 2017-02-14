import { observable, action } from 'mobx'
import axios from 'axios'
import _ from 'lodash'
export default class {
  @observable games
  @observable notification
  @observable kw
  pagecount = 1
  @action async load () {
    this.pagecount = 1
    const g = await axios.get('/api')
    this.games = {
      total: g.data.hits.total,
      results: g.data.hits.hits.map(h => {
        const hh = h._source
        hh._id = h._id
        return hh
      }),
      pages: _.chunk(_.range(0, g.data.hits.total), 12).length
    }
    this.kw = null
    this.notify(`${this.games.total} games found`, 'success')
  }
  @action async search (kw) {
    this.pagecount = 1
    const g = await axios.get(`/api?q=${kw}`)
    this.kw = kw
    this.games = {
      total: g.data.hits.total,
      results: g.data.hits.hits.map(h => {
        const hh = h._source
        hh._id = h._id
        return hh
      }),
      pages: _.chunk(_.range(0, g.data.hits.total), 12).length
    }
  }
  @action async reload () {
    this.notify('Restarting EmulationStation', 'warning')
    await axios.get('/api/reload')
    this.notify('Restarted EmulationStation', 'success')
  }
  @action async loadMore () {
    this.pagecount += 1
    if (this.pagecount <= this.games.pages) {
      let url = `/api?page=${this.pagecount}`
      if (this.kw) {
        url += `&q=${this.kw}`
      }
      const g = await axios.get(url)
      if (g.status === 200) {
        g.data.hits.hits.map(r => {
          {
            const v = r._source
            v._id = r._id
            this.games.results.push(v)
          }
        })
      }
    } else {
      this.pagecount -= 1
    }
  }
  @action async download (id) {
    const meta = _.first(this.games.results.filter(g => g._id === id._id))
    await axios.get(`/api/download/${meta.console}/${meta._id}`)
    this.notify(`Downloaded ${meta.title}`, 'success')
  }
  @action notify (message, intent, onClick) {
    let icon
    switch (intent) {
      case 'primary':
        icon = 'info'
        break
      case 'success':
        icon = 'check'
        break
      case 'danger':
        icon = 'exclamation'
        break
      case 'warning':
        icon = 'exclamation-triangle'
        break
      default:
        icon = 'question'
        break
    }
    this.notification = {
      message,
      intent,
      icon,
      onClick
    }
    if (!onClick) {
      setTimeout(() => {
        this.notification = null
      }, 3000)
    }
  }
}
