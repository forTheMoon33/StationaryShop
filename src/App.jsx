import { Routes, Route, Navigate } from 'react-router-dom'
import MainMenu from './pages/MainMenu/MainMenu.jsx'
import Game from './pages/Game/Game.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/game" element={<Game />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
