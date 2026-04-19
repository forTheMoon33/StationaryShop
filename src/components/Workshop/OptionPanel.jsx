import styles from './OptionPanel.module.css'

const STEP_LABELS = {
  1: 'Choose a size',
  2: 'Define zones',
  3: 'Assign materials',
  4: 'Choose colors',
  5: 'Add decorations',
  6: 'Choose a closure',
  7: 'Add accessories',
}

export default function OptionPanel({ children, currentStep, zones = [] }) {
  const zoneCount    = zones.length
  const showZoneHint = currentStep >= 3 && currentStep <= 5 && zoneCount > 0

  return (
    <div className={styles.wrapper}>
      <div className={styles.context}>
        <span className={styles.stepLabel}>
          Step {currentStep} — {STEP_LABELS[currentStep]}
        </span>
        {showZoneHint && (
          <span className={styles.zoneHint}>
            {zoneCount} zone{zoneCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
