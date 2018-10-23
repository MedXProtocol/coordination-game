import React, { Component } from 'react'
import { Route, Redirect } from 'react-router-dom'
import { get } from 'lodash'
import { connect } from 'react-redux'
import * as routes from '~/../config/routes'

function mapStateToProps (state, ownProps) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const web3Initialized = get(state, 'sagaGenesis.web3.initialized')

  return {
    address,
    web3Initialized
  }
}

export const Web3Route = connect(mapStateToProps)(
  class _Web3Route extends Component {
    renderComponent (props) {
      const Component = this.props.component
      return <Component {...props} {...this.props} />
    }

    redirect () {
      let redirect
      if (!this.props.web3Initialized || !this.props.address) {
        redirect = routes.HOME
      }
      return redirect
    }

    render () {
      let component
      const redirect = this.redirect()
      if (redirect) {
        component = <Redirect to={redirect} />
      } else {
        const otherProps = {
          ...this.props,
          component: undefined
        }
        console.log(otherProps)
        component = (
          <Route {...otherProps} render={props => this.renderComponent(props)} />
        )
      }
      return component
    }
  }
)
