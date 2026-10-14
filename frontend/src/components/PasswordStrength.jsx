import { passwordScore, passwordScoreLabel } from '../lib/validators.js'

const strengthColors = [
  'bg-base-400',
  'bg-red-500',
  'bg-amber-400',
  'bg-blue-500',
  'bg-emerald-500',
]

export default function PasswordStrength({ value }) {
  if (!value) return null
  const score = passwordScore(value)

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < score ? strengthColors[score] : 'bg-base-700'
            }`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-base-400">{passwordScoreLabel[score]}</p>
    </div>
  )
}
