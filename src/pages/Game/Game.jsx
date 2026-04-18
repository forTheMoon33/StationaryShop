import { useState } from 'react'
import Shop from './tabs/Shop.jsx'
import Workshop from './tabs/Workshop.jsx'
import OnlineChat from './tabs/OnlineChat.jsx'
import styles from './Game.module.css'

const TABS = [
  { id: 'shop', label: 'Shop', component: Shop },
  { id: 'workshop', label: 'Workshop', component: Workshop },
  { id: 'chat', label: 'Online Chat', component: OnlineChat },
]

export default function Game() {
  const [activeTab, setActiveTab] = useState('shop')

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component

  return (
    <div className={styles.layout}>
      <header className={styles.topBar}>
        <nav className={styles.tabList}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className={styles.content}>
        {ActiveComponent && <ActiveComponent />}
      </main>
    </div>
  )
}
