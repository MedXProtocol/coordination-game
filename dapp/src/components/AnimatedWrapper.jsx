import React, { Component } from 'react'

export const AnimatedWrapper = (WrappedComponent) =>
  class _AnimatedWrapper extends Component {
    render() {
      return (
        <div className='animated-page-wrapper'>
          <WrappedComponent {...this.props} />
        </div>
      )
    }
  }
