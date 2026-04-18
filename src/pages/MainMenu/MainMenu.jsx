import { useNavigate } from 'react-router-dom'
import styles from './MainMenu.module.css'

const menuButtons = [
  { label: 'Load Game', action: null },
  { label: 'New Game', action: 'new' },
  { label: 'Settings', action: null },
  { label: 'Quit', action: null },
]

export default function MainMenu() {
  const navigate = useNavigate()

  function handleClick(action) {
    if (action === 'new') {
      navigate('/game')
    }
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Stationery<br />Shop</h1>
          <p className={styles.subtitle}>文具店</p>
        </div>

        <nav className={styles.nav}>
          {menuButtons.map(({ label, action }) => (
            <button
              key={label}
              className={styles.menuBtn}
              onClick={() => handleClick(action)}
              disabled={action === null}
            >
              {label}
            </button>
          ))}
        </nav>

        <p className={styles.version}>v0.1.0</p>
      </aside>

      <main className={styles.background}>
        <span className={styles.placeholder}>illustration placeholder</span>
      </main>
    </div>
  )
}
