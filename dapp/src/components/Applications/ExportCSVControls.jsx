import React, { Component } from 'react'
import classnames from 'classnames'
import { CSVLink } from 'react-csv'
import { mailtoCsvLink } from '~/utils/mailtoCsvLink'

// This is a bugfix for react-csv which can be removed when they fix it upstream:
class PropDataUpdatedCSVLink extends CSVLink {
	componentWillReceiveProps(nextProps) {
		const { data, headers, separator, uFEFF } = nextProps
		this.setState({ href: this.buildURI(data, uFEFF, headers, separator) })
	}
}

export const ExportCSVControls = class _ExportCSVControls extends Component {

  constructor(props) {
    super(props)

    this.state = {
      filename: 'token-reg-applications.csv'
    }
  }

  handleTextInputChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

	handleMailCsv = (e) => {
		e.preventDefault()

		if (window) {
			window.location.href = mailtoCsvLink(
				'Token Registry Applications Export CSV',
				["Application ID#", "Hint", "Random #", "Secret"],
				this.props.csvData
			)
		}
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
							type="text"
              name="filename"
              onChange={this.handleTextInputChange}
              className="text-input text-input--filename"
              value={this.state.filename}
            />
          </div>
          <div className="control">
						<button
							onClick={this.handleMailCsv}
							className="button is-info is-addon text-input--filename-button"
						>
							Email
						</button>

            <PropDataUpdatedCSVLink
              data={this.props.csvData}
              headers={[
                { label: "Application ID#", key: "applicationId" },
                { label: "Hint", key: "hint" },
                { label: "Random #", key: "random" },
                { label: "Secret", key: "secret" }
              ]}
              filename={this.state.filename}
              className="button is-primary is-addon text-input--filename-button"
            >
              Download
            </PropDataUpdatedCSVLink>
          </div>
        </div>
      </div>
    )
  }
}
