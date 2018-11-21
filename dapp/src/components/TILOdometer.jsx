import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import Odometer from 'react-odometerjs'

export const TILOdometer = ReactTimeout(
  class _TILOdometer extends Component {
    constructor(props) {
      super(props)

      this.state = {
        currentValue: '',
        delay: props.delay || 2000,
        nextValue: '',
        upToDate: false
      }
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.value !== this.state.nextValue) {
        this.setState({
          nextValue: nextProps.value,
          upToDate: false
        }, () => {
          this.props.setTimeout(() => {
            this.setState({
              currentValue: nextProps.value,
              upToDate: true
            })
          }, this.state.delay)
        })

      }
    }

    render() {
      // console.log(this.state.nextValue)
      // console.log(this.state.currentValue)
      return (
        <Odometer value={this.state.upToDate ? this.state.nextValue : this.state.currentValue} />
      )
    }
  }
)
