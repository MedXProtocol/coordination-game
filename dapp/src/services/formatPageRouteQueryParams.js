import queryString from 'query-string'

export function formatPageRouteQueryParams (path, paramName, number, location) {
  const queryParamsString =
    queryString.stringify(
      Object.assign({},
        queryString.parse(location.search), {
          [paramName]: number
        }
      )
    )

  return {
    pathname: path,
    search: queryParamsString
  }
}
