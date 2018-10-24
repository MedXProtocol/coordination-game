import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import classnames from 'classnames'
import { NetworkCheck } from '~/components/NetworkCheck'
import { Link } from 'react-router-dom'
import * as routes from '~/../config/routes'

export const Header = ReactTimeout(
  class _Header extends Component {

    constructor(props) {
      super(props)
      this.state = {
        oneVisible: false,
        twoVisible: false
      }
    }

    componentDidMount() {
      this.props.setTimeout(() => {
        this.setState({
          oneVisible: true
        })
      }, 200)

      this.props.setTimeout(() => {
        this.setState({
          twoVisible: true
        })
      }, 600)
    }

    render () {
      return (
        <React.Fragment>
          <nav
            className={classnames(
              'navbar',
              'is-fixed-top',
              'navbar--row-one',
              'fade-in',
              { 'fade-in-start': this.state.oneVisible }
            )
          }>
            <div className="container is-fluid">
              <div className="navbar-brand">
                <div className="navbar-item">
                  <h1>
                    <Link to={routes.HOME}>
                      The Coordination Game
                      &nbsp; <span className="has-text-transparent-white">Trustless Incentivized List Demo</span>
                      </Link>
                  </h1>
                </div>
              </div>

              <NetworkCheck />
            </div>
          </nav>

          <nav
            className={classnames(
              'navbar',
              'is-fixed-top',
              'navbar--row-two',
              'fade-in',
              { 'fade-in-start': this.state.twoVisible }
            )
          }>
            <div className="container is-fluid">
              <div className="navbar-menu">
                <div className="navbar-end">
                  <div className="navbar-item">
                    <Link to={routes.HOME} className="navbar-item">
                      Registry
                    </Link>
                  </div>
                  <div className="navbar-item">
                    <Link to={routes.APPLY} className="navbar-item">
                      Apply
                    </Link>
                  </div>
                  <div className="navbar-item">
                    <Link to={routes.STAKE} className="navbar-item">
                      Stake
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </React.Fragment>
      )
    }
  }
)
