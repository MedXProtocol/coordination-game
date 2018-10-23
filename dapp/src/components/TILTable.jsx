import React, { Component } from 'react'

export const TILTable = class _TILTable extends Component {
  render() {
    return (
      <div className="entries has-text-centered">
        <table className="table is-fullwidth">
          <thead>
            <tr>
              <th></th>
              <th>Application #</th>
              <th>Hint</th>
              <th>Secret</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>May 31st, 2018</th>
              <th>1</th>
              <th>200 + 200</th>
              <th>400</th>
              <th>Verified</th>
            </tr>
            <tr>
              <th>June 2nd, 2018</th>
              <th>2</th>
              <th>300 + 2</th>
              <th>5693</th>
              <th>Rejected</th>
            </tr>
            <tr>
              <th>July 20th, 2018</th>
              <th>3</th>
              <th>342 + 182</th>
              <th>3</th>
              <th>Challenged</th>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
}
