import React from 'react'
import { format } from 'date-fns'

function formatTimestamp(time) {
  const date = new Date(0)
  date.setUTCSeconds(time)

  return {
    timezoneOffset: format(date, 'Z'),
    date: format(date, 'MMM Do, YYYY'),
    time: format(date, 'H:mm:ss')
  }
}

export const RecordTimestampDisplay = ({ timeInUtcSecondsSinceEpoch, delimiter }) => {
  if (!timeInUtcSecondsSinceEpoch || (timeInUtcSecondsSinceEpoch < 1)) { return null }

  const formattedTimestamp = formatTimestamp(timeInUtcSecondsSinceEpoch)

  const entries = `${formattedTimestamp.date} ${delimiter ? delimiter : ``} ${formattedTimestamp.time}`

  return (
    <span dangerouslySetInnerHTML={{__html: entries}} />
  )
}
