import React from 'react'

const cssClass = 'html-light'

export const BodyClass = class _BodyClass extends React.Component {
  static defaultProps = {
    isLight: true
  }

  componentDidMount() {
    document.documentElement.classList.toggle(cssClass, this.props.isLight)
    document.body.classList.toggle(cssClass, this.props.isLight)
  }

  componentWillReceiveProps(nextProps) {
    document.documentElement.classList.toggle(cssClass, nextProps.isLight)
    document.body.classList.toggle(cssClass, nextProps.isLight)
  }

  componentWillUnmount() {
    document.documentElement.classList.remove(cssClass)
    document.body.classList.remove(cssClass)
  }

  render() {
    return this.props.children
  }
}
