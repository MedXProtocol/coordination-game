import React from 'react'
import bugsnagReact from '@bugsnag/plugin-react'
import { bugsnagClient } from '~/bugsnagClient'

let boundary

if (process.env.REACT_APP_BUGSNAG_API_KEY && process.env.REACT_APP_ENV) {
  bugsnagClient.use(bugsnagReact, React)
  boundary = bugsnagClient.getPlugin('react')
} else {
  boundary = class ErrorBoundary extends React.Component {
    componentDidCatch(error, errorInfo) {
      bugsnagClient.notify(error, errorInfo)
    }

    render() {
      return this.props.children;
    }
  }
}

export const ErrorBoundary = boundary
