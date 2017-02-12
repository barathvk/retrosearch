import React from 'react'
import { observer, inject } from 'mobx-react'
import Notification from './Notification'
import VisibilitySensor from 'react-visibility-sensor'
import Error from './Error'
@inject('store') @observer
export default class extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      kw: null,
      hasMore: true
    }
    this.search = e => {
      this.state.kw = e.target.value
      this.setState(this.state)
      if (e.target.value.length >= 0) this.props.store.search(e.target.value)
      else this.props.store.load()
    }
    this.more = async e => {
      if (e && this.state.hasMore) {
        this.state.isLoading = true
        this.setState(this.state)
        try {
          await this.props.store.loadMore()
        } catch (err) {}
        if (this.props.store.pagecount >= this.props.store.games.pages) {
          this.state.hasMore = false
        }
        this.state.isLoading = false
        this.setState(this.state)
      }
    }
  }
  render () {
    const store = this.props.store
    let items
    if (store.games && store.games.results) {
      items = store.games.results.map((r, i) => {
        return (
          <div className='card flex-1 flex-column animated fadeInDown' key={i}>
            <div className='card-image'>
              <figure className='image is-1by1'>
                <img src={r.image} />
              </figure>
            </div>
            <div className='media-content fill'>
              <p className='title is-4 flex-row flex-center-align'>
                <i className='fa fa-tag' />
                <span className='truncate'>{r.title}</span>
              </p>
            </div>
          </div>
        )
      })
    }
    return (
      <div className='fill flex-column'>
        {
          !store.games && (
            <div className='fill flex-column flex-center'>
              <div className='spinner' />
            </div>
          )
        }
        {
          store.games && (
            <div className='flex-column fill'>
              <p className='control search-box has-icon has-addons flex-row flex-center-align'>
                <input type='search' placeholder='Search' className='input fill' value={this.state.kw || ''} onChange={this.search} />
                <span className='icon'>
                  <i className='fa fa-search' />
                </span>
                <span className='flex-row flex-center-align count-label tag is-info is-medium'>
                  <i className='fa fa-gamepad' />
                  {store.games.total} games [Page {store.pagecount} of {store.games.pages}]
                </span>
              </p>
              {
                store.games.results && (
                  <div className='container flex-row flex-wrap'>
                    {items}
                    <VisibilitySensor onChange={this.more} />
                    {
                      this.state.isLoading && (
                        <div className='flex-column flex-center'>
                          <div className='spinner' />
                        </div>
                      )
                    }
                  </div>
                )
              }
              {
                !store.games.results && (
                  <Error message={`No results found for ${this.state.kw}`} />
                )
              }
            </div>
          )
        }
        {
          store.notification && (
            <Notification />
          )
        }
      </div>
    )
  }
}
