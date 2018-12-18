export const getMobileOperatingSystem = function() {
  const userAgent = window.opera || navigator.userAgent || navigator.vendor

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return "iOS"
  } else if (/android/i.test(userAgent)) {
    return "Android"
  }

  return "unknown"
}
