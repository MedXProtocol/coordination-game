const SEPERATOR = ", "

// url-encoded version of \r\n
const LINE_BREAK = '%0D%0A'

function mailtoCSV(headers, entries) {
  let textLines = []

  textLines.push(createTextLine(headers))

  // if the entries array was an array of objects
  // convert each obj to a basic array of values
  if (typeof entries[0] === 'object') {
    entries = entries.map(entry => Object.values(entry))
  }

  entries.forEach(entry => textLines.push(createTextLine(entry)))

  return textLines.join(LINE_BREAK)
}

function createTextLine(values) {
  let result = []

  values.forEach(function(value) {
    const text = value.toString()

    if (text.indexOf(SEPERATOR) == -1 && text.indexOf('"') == -1) {
      result.push(text)
    } else {
      result.push('"' + text.replace(/"/g, '""') + '"')
    }
  })

  return result.join(SEPERATOR)
}

export const mailtoCsvLink = function(subject, headers, entries) {
  const body = mailtoCSV(headers, entries)

  return `mailto:?subject=${subject}&body=${body}`
}

// window.location.href =

// and if that doesn't work, try this instead:
// window.open(link)
