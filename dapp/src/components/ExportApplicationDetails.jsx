import React, { Component } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExport } from '@fortawesome/free-solid-svg-icons'

export const ExportApplicationDetails = class _ExportApplicationDetails extends Component {

  exportApplicationDetails = () => {
    alert(`Random: ${this.props.applicationRowObject.random}`)
  }

  render() {
    if (this.props.applicationRowObject.random === undefined) { return null }

    return (
      <button
        className="icon-circle"
        onClick={this.exportApplicationDetails}
      >
        <FontAwesomeIcon
          icon={faFileExport}
        />
      </button>
    )
  }

}
