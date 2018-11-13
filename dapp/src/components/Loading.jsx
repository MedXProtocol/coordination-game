import React, { Component } from 'react'
import { connect } from 'react-redux'
import ReactTimeout from 'react-timeout'
import classnames from 'classnames'
import PropTypes from 'prop-types'

const REFRESH_DELAY_MS = 10000

function mapStateToProps (state) {
  const showLoadingStatus = state.loadingStatus.showLoadingStatus

  return {
    showLoadingStatus
  }
}

export const Loading = connect(mapStateToProps)(
  ReactTimeout(
    class _Loading extends Component {

      static propTypes = {
        showLoadingStatus: PropTypes.bool.isRequired
      }

      constructor(props) {
        super(props)

        this.state = {
          showReload: false
        }
      }

      componentWillReceiveProps(nextProps) {
        if (this.props.showLoadingStatus !== nextProps.showLoadingStatus) {

          if (nextProps.showLoadingStatus) {
            this.reloadTimeout = this.props.setTimeout(() => {
              this.setState({ showReload: true })
            }, REFRESH_DELAY_MS)
          } else if (!nextProps.showLoadingStatus) {
            this.props.clearTimeout(this.reloadTimeout)

            this.props.setTimeout(() => {
              this.setState({ showReload: false })
            }, REFRESH_DELAY_MS * 0.1)
          }

        }
      }

      render() {
        let checkMetaMask,
          showReloadMsg

        if (this.state.showReload) {
          showReloadMsg = (
            <span className="small">
              <br />
              This is taking longer than expected.
              <br />If the app is not responding you can refresh and try again:
              <br />
              <br />
              <button
                className="button is-info is-outlined"
                onClick={(e) => {
                  e.preventDefault()
                  if (window) {
                    window.location.reload(true)
                  }
                }}
              >
                Refresh
              </button>
            </span>
          )
        } else {
          checkMetaMask = <span className="is-hidden-touch small">(You may need to check MetaMask)</span>
        }

        return (
          <div
            className={classnames(
              'loading--overlay',
              'fade-in',
              'mid-slow',
              {
                'anim-fade-in': this.props.showLoadingStatus,
                'visible': this.props.showLoadingStatus
              }
            )}
          >
            <div className="loading">
              <h5 className="is-size-5">
                Working on your request ...
                <br />
                {checkMetaMask}
                {showReloadMsg}
              </h5>
            </div>
          </div>
        )
      }
    }
  )
)
