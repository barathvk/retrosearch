import React from 'react'
import { observer, inject } from 'mobx-react'
@inject('store') @observer
export default class extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
    this.onClick = () => {
      if (this.props.onClick) this.props.store.notification.onClick()
      else this.props.store.notification = null
    }
  }
  render () {
    const props = this.props.store.notification
    return (
      <a className={`flex-row notification animated bounceInUp flex-center is-${props.intent}`} onClick={this.onClick}>
        <span className={`fa fa-${props.icon}`} />
        {props.message}
      </a>
    )
  }
}
