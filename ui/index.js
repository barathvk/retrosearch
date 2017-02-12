import 'babel-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'
import './css/style.scss'
import { Provider } from 'mobx-react'
import Store from './store'
const store = new Store()
store.load()
ReactDOM.render(<Provider store={store}><App /></Provider>, document.getElementById('root'))
