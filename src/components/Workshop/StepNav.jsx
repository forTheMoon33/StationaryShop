import styles from './StepNav.module.css'

export default function StepNav({ steps, currentStep, completedSteps, onStepClick }) {
  return (
    <nav className={styles.nav}>
      {steps.map((step, i) => {
        const isCompleted = completedSteps.has(step.id)
        const isActive = step.id === currentStep
        const isClickable = isCompleted && !isActive

        const circleClass = [
          styles.circle,
          isCompleted ? styles.completed : '',
          isActive    ? styles.active    : '',
          !isCompleted && !isActive ? styles.future : '',
        ].filter(Boolean).join(' ')

        const labelClass = [
          styles.label,
          !isCompleted && !isActive ? styles.labelFuture : '',
        ].filter(Boolean).join(' ')

        return (
          <div key={step.id} className={styles.item}>
            {/* connector line before this step (except first) */}
            {i > 0 && (
              <div
                className={[
                  styles.connector,
                  completedSteps.has(step.id - 1) ? styles.connectorDone : '',
                ].filter(Boolean).join(' ')}
              />
            )}

            <div className={styles.stepCol}>
              <button
                className={circleClass}
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${step.id}: ${step.label}${isCompleted ? ' (completed)' : ''}`}
              >
                {isCompleted && !isActive
                  ? <Checkmark />
                  : <span className={styles.num}>{step.id}</span>
                }
              </button>
              <span className={labelClass}>{step.label}</span>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

function Checkmark() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
      <path
        d="M1.5 5.5L5.5 9.5L12.5 1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
