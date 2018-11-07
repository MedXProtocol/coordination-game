import React from 'react'
import { Link } from 'react-router-dom'
import { toastr as toastrLib } from 'react-redux-toastr'
import { txErrorMessage } from '~/services/txErrorMessage'

const ToastrLinkComponent = ({ link, remove }) => {
  if (!link.path && !link.url) {
    throw new Error('link.path or link.url was not passed to a toastr msg')
  } else if (!link.text) {
    throw new Error('link.text was not passed to a toastr msg')
  }

  if (link.path) {
    return <Link to={link.path}>{link.text}</Link>
  } else if (link.url) {
    return <a rel="noopener noreferrer" target="_blank" href={link.url}>{link.text}</a>
  }
}

function success(message, link) {
  const options = { icon: 'success', status: 'success' }
  options['component'] = link ? <ToastrLinkComponent link={link} /> : null

  toastrLib.light('Success', message, options)
}

function error(message, link) {
  const options = { icon: 'error', status: 'error' }
  options['component'] = link ? <ToastrLinkComponent link={link} /> : null

  toastrLib.light('Error', message, options)
}

function warning(message, link) {
  const options = { icon: 'warning', status: 'warning' }
  options['component'] = link ? <ToastrLinkComponent link={link} /> : null

  toastrLib.light('Warning', message, options)
}

function transactionError(exception) {
  error(txErrorMessage(exception))
}

export const toastr = {
  success,
  error,
  warning,
  transactionError
}
