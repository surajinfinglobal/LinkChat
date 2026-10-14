export function isValidEmail(value) {
  if (!value) return false
  // Pragmatic RFC-5322-ish check, good enough for client-side validation.
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(value.trim())
}

export function passwordScore(value) {
  if (!value) return 0
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  return Math.min(score, 4)
}

export const passwordScoreLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
export const passwordScoreColor = [
  'bg-ink-700',
  'bg-coral-500',
  'bg-amber-400',
  'bg-azure-500',
  'bg-mint-500',
]

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
