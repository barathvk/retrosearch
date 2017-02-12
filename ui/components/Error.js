import React from 'react'
import { observer, inject } from 'mobx-react'
@inject('store') @observer
export default class extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }
  render () {
    return (
      <div className={`flex-column error fill animated bounce flex-center`}>
        <span className='fa fa-exclamation' />
        {this.props.message}
      </div>
    )
  }
}
