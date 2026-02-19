import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { YearPage } from './pages/YearPage'
import { LearningPage } from './pages/LearningPage'
import { RandomPage } from './pages/RandomPage'
import { ReviewPage } from './pages/ReviewPage'

// Derive basename from Vite's base config to keep them in sync
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn/random" element={<RandomPage />} />
        <Route path="/learn/:year" element={<YearPage />} />
        <Route path="/learn/:year/:index" element={<LearningPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
