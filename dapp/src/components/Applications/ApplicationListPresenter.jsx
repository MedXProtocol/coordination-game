import React from 'react'
import ReactTooltip from 'react-tooltip'
import classnames from 'classnames'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronUp } from '@fortawesome/free-solid-svg-icons'

export const ApplicationListPresenter = function({ linkTo, id, date, status, view, needsAttention, ofInterest }) {
  // necessary to show the verifier on 1st-time component load
  ReactTooltip.rebuild()

  return (
    <Link
      to={linkTo}
      className={classnames(
        'list--item',
        'list--application-item',
        {
          'is-warning': needsAttention,
          'is-info': ofInterest && !needsAttention
        }
      )}
    >
      <span className="list--item__id">
        <FontAwesomeIcon icon={faChevronUp} className="list--icon" />
        {id}
      </span>

      <span className="list--item__date">
        {date}
      </span>

      <span className='list--item__status'>
        {status}
      </span>

      <span className="list--item__view">
        {view}
      </span>
    </Link>
  )
}
