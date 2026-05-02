import styles from './OptionPanel.module.css'

const STEP_LABELS = {
  1: 'Choose a size',
  2: 'Exterior design',
  3: 'Interior design',
  4: 'Add decorations',
  5: 'Choose a closure',
  6: 'Add accessories',
}

export default function OptionPanel({ children, currentStep }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.context}>
        <span className={styles.stepLabel}>
          Step {currentStep} — {STEP_LABELS[currentStep]}
        </span>
      </div>

      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
