import React, {
  PureComponent
} from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

export class ListingRow extends PureComponent {
  render () {
    return (
      <div className='list--item'>
        <span className="list--item__id">
          Listing ID
        </span>

        <span className="list--item__date">
          The date
        </span>

        <span className='list--item__status'>
          expires
        </span>

        <span className="list--item__view text-right">
          verify
        </span>
      </div>
    )
  }
}

ListingRow.propTypes = {
  listingHash: PropTypes.string.isRequired
}
