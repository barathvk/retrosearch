import React from 'react'
import { observer, inject } from 'mobx-react'
@inject('store') @observer
export default class extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }
  render () {
    const props = this.props.store.notification
    return (
      <div className={`flex-row notification animated bounceInUp flex-center is-${props.intent}`}>
        <span className={`fa fa-${props.icon}`} />
        {props.message}
      </div>
    )
  }
}
