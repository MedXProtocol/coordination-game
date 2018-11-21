import { Challenge } from '~/models/Challenge'

export function mapToChallenge(array) {
  return new Challenge(array)
}
