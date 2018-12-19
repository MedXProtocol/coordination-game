import { Listing } from '~/models/Listing'

export function mapToListing (array) {
  return new Listing(array)
}
