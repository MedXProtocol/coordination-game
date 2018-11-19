import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import { TransitionGroup, CSSTransition } from 'react-transition-group'


import * as Animated from 'animated/lib/targets/react-dom'

export const AnimatedWrapper = (WrappedComponent) => ReactTimeout(
  class _AnimatedWrapper extends Component {
    constructor(props) {
      super(props)
      console.log('state set')
      this.state = {
        animate: new Animated.Value(0)
      }
    }

    componentDidMount() {
      console.log('cdm')
    }

    componentWillUnmount() {
      console.log('cwu')

    }

    componentWillAppear(cb) {
      console.log('cwa')
      Animated.spring(this.state.animate, { toValue: 1 }).start()
      cb()
    }

    componentWillEnter(cb) {
      console.log('cwe')
      this.props.setTimeout(
        () => Animated.spring(this.state.animate, { toValue: 1 }).start(),
        250
      )
      cb()
    }

    componentWillLeave(cb) {
      console.log('cwl')
      Animated.spring(this.state.animate, { toValue: 0 }).start()
      this.props.setTimeout(() => cb(), 175)
    }

    render() {
      // const style = {
      //   opacity: Animated.template`${this.state.animate}`,
      //   transform: Animated.template`
      //     translate3d(0,${this.state.animate.interpolate({
      //       inputRange: [0, 1],
      //       outputRange: ["12px", "0px"]
      //     })},0)
      //   `
      // }
      // console.log(style)
//  style={style}

      return (
        <Animated.div className='animated-page-wrapper'>
          <WrappedComponent {...this.props} />
        </Animated.div>
      )
    }
  }
)
