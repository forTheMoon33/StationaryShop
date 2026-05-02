import styles from './FaceSelector.module.css'

const EXTERIOR_FACES = [
  { id: 'exterior-right', label: 'Front Cover' },
  { id: 'exterior-left',  label: 'Back Cover'  },
  { id: 'spine-exterior', label: 'Spine'        },
]

const INTERIOR_FACES = [
  { id: 'interior-right', label: 'Inside Front' },
  { id: 'interior-left',  label: 'Inside Back'  },
  { id: 'spine-interior', label: 'Spine Inner'  },
]

export { EXTERIOR_FACES, INTERIOR_FACES }

export default function FaceSelector({ mode = 'exterior', activeFaceId, onSelectFace }) {
  const faces = mode === 'exterior' ? EXTERIOR_FACES : INTERIOR_FACES
  const title  = mode === 'exterior' ? 'Exterior' : 'Interior'

  return (
    <div className={styles.sidebar}>
      <p className={styles.title}>{title} Faces</p>
      <div className={styles.tabs}>
        {faces.map(f => (
          <button
            key={f.id}
            className={`${styles.tab} ${activeFaceId === f.id ? styles.active : ''}`}
            onClick={() => onSelectFace(f.id)}
            aria-pressed={activeFaceId === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
