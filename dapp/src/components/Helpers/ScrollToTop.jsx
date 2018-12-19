import { Component } from 'react'

export class ScrollToTop extends Component {
  componentDidMount() {
    if (!this.props.disabled) {
      window.scrollTo(0, 0)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.scrollToTop && !nextProps.disabled) {
      window.scrollTo(0, 0)
    }
  }

  render() {
    return null
  }
}
