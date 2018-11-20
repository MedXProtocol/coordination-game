import React, {
  Component
} from 'react'
import { Link } from 'react-router-dom'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { range } from 'lodash'

const NUM_VALUES_TO_SHOW = 5

export class Pagination extends Component {
  static propTypes = {
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    formatPageRoute: PropTypes.func.isRequired
  }

  calculatePageValues = () => {
    const startNum = Math.max(this.props.currentPage - NUM_VALUES_TO_SHOW, 2)
    const endNum   = Math.min(this.props.currentPage + NUM_VALUES_TO_SHOW, this.props.totalPages)

    const pageNumbers = range(startNum, endNum)

    // Add ellipsis to end, before last to show that there's more pages truncated
    // do this calculation first, before adding the ellipsis at the front
    const isManyPages = this.props.totalPages > NUM_VALUES_TO_SHOW
    const currentPageIsFarBelowTotal = (this.props.currentPage < (this.props.totalPages - NUM_VALUES_TO_SHOW))

    if (isManyPages && currentPageIsFarBelowTotal) {
      pageNumbers.splice(pageNumbers.length, 0, '...')
    }

    // Add ellipsis after the first page to show that there's more pages truncated
    const beginningTruncated = this.props.currentPage > (NUM_VALUES_TO_SHOW + 1)
    if (beginningTruncated) {
      pageNumbers.splice(0, 0, '...')
    }


    // We always want the first and last pages in the array
    const needsFirstPage = pageNumbers[0] !== 1
    if (needsFirstPage) {
      pageNumbers.splice(0, 0, 1)
    }

    const needsLastPage = pageNumbers[pageNumbers.length-1] !== this.props.totalPages
    if (needsLastPage) {
      pageNumbers.push(this.props.totalPages)
    }

    return pageNumbers
  }

  renderPageNumbers = function() {
    const pageListItems = []

    this.calculatePageValues().forEach((value, index) => {
      if (value === '...') {
        pageListItems.push(
          <li key={`page-ellipsis-${index}`} >
            <span className='pagination-ellipsis'>
              &hellip;
            </span>
          </li>
        )
      } else {
        pageListItems.push(
          <li key={`page-number-${value}`} >
            <Link
              to={this.props.formatPageRoute(value)}
              className={classnames(
                'pagination-link',
                { 'is-current': this.props.currentPage === value }
              )}>
              {value}
            </Link>
          </li>
        )
      }
    })

    return (
      <ul className="pagination">
        {pageListItems}
      </ul>
    )
  }

  render () {
    if (this.props.totalPages > 1) {
      return (
        <div className='card'>
          <div className='card-content'>
            <nav aria-label="Page navigation" className="pagination is-centered" role='navigation'>
              <ul className='pagination-list'>
                {this.renderPageNumbers()}
              </ul>
            </nav>
          </div>
        </div>
      )
    } else {
      return null
    }
  }
}
