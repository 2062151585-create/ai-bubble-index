import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import IndexDetail from './pages/IndexDetail'
import History from './pages/History'
import Scenarios from './pages/Scenarios'
import Advisory from './pages/Advisory'
import About from './pages/About'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/index-detail" element={<IndexDetail />} />
        <Route path="/history" element={<History />} />
        <Route path="/scenarios" element={<Scenarios />} />
        <Route path="/advisory" element={<Advisory />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  )
}
