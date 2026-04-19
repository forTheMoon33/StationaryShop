import styles from './ZonePanel.module.css'

export default function ZonePanel({ zones = [], selectedIndex, onSelect, assignments = [] }) {
  if (zones.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyText}>Complete step 2 to define zones.</span>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <p className={styles.heading}>Zones</p>
      <ul className={styles.list}>
        {zones.map((zone, i) => {
          const assigned = assignments[i] || {}
          const isSelected = selectedIndex === i

          return (
            <li key={i}>
              <button
                className={[styles.row, isSelected ? styles.rowSelected : ''].join(' ')}
                onClick={() => onSelect(i)}
                aria-pressed={isSelected}
              >
                <span
                  className={styles.swatch}
                  style={{ background: assigned.color || '#e8dfd0' }}
                />
                <span className={styles.zoneName}>{zone.name}</span>
                <span className={[
                  styles.value,
                  assigned.label === '—' ? styles.valuePlaceholder : '',
                ].join(' ')}>
                  {assigned.label || '—'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
