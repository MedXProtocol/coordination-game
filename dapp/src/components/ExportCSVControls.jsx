import React, { Component } from 'react'
import classnames from 'classnames'
import { CSVLink } from 'react-csv'

// This is a bugfix for react-csv which can be removed when they fix it upstream:
class PropDataUpdatedCSVLink extends CSVLink {
	// constructor(props) {
	// 	super(props)
	// }

	componentWillReceiveProps(nextProps) {
		const { data, headers, separator, uFEFF } = nextProps
		this.setState({ href: this.buildURI(data, uFEFF, headers, separator) })
	}
}

export const ExportCSVControls = class _ExportCSVControls extends Component {

  constructor(props) {
    super(props)

    this.state = {
      downloadClicked: false,
      filename: 'coordinationGame-applications.csv'
    }
  }

  handleTextInputChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  render () {
    return (
      <div
        className={classnames(
          'file-download--container',
          { 'is-hidden': !this.props.showCsvLink }
        )}
      >
        <div className="field has-addons is-pulled-right">
          <div className="control text-input--filename-control">
            <input
              name="filename"
              type="text"
              onChange={this.handleTextInputChange}
              className="text-input text-input--filename"
              value={this.state.filename}
            />
          </div>
          <div className="control">
            <PropDataUpdatedCSVLink
              data={this.props.csvData}
              headers={[
                { label: "Application ID#", key: "applicationId" },
                { label: "Hint", key: "hint" },
                { label: "Random #", key: "random" },
                { label: "Secret", key: "secret" }
              ]}
              filename={this.state.filename}
              className="button is-outlined is-primary is-addon text-input--filename-button"
            >
              Download
            </PropDataUpdatedCSVLink>
          </div>
        </div>
      </div>
    )
  }
}
