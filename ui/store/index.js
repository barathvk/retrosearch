import { observable, action } from 'mobx'
import axios from 'axios'
export default class {
  @observable games
  @observable notification
  @observable kw
  pagecount = 1
  @action async load () {
    this.pagecount = 1
    const g = await axios.get('/api?size=12')
    this.games = g.data
    this.kw = null
    this.notify(`${this.games.total} games found`, 'success')
  }
  @action async search (kw) {
    this.pagecount = 1
    const g = await axios.get(`/api?size=12&q=${kw}`)
    this.kw = kw
    this.games = g.data
  }
  @action async loadMore () {
    this.pagecount += 1
    if (this.pagecount <= this.games.pages) {
      let url = `/api?size=24&page=${this.pagecount}`
      if (this.kw) {
        url += `&q=${this.kw}`
      }
      const g = await axios.get(url)
      if (g.status === 200) g.data.results.map(r => this.games.results.push(r))
    } else {
      this.pagecount -= 1
    }
  }
  @action notify (message, intent) {
    let icon
    switch (intent) {
      case 'primary':
        icon = 'info'
        break
      case 'success':
        icon = 'check'
        break
      case 'danger':
        icon = 'error'
        break
      default:
        icon = 'question'
    }
    this.notification = {
      message,
      intent,
      icon
    }
    setTimeout(() => {
      this.notification = null
    }, 3000)
  }
}
