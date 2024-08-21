import { useQuerySync } from '@dojoengine/react'
import { PixelViewer } from './components/PixelViewer'
import { useDojo } from '@/libs/dojo/useDojo'
import { Header } from './components/Header'

function App() {
  const {
    setup: { contractComponents, toriiClient },
    account: { account },
  } = useDojo()

  useQuerySync(toriiClient, contractComponents as any, [])

  return (
    <main>
      <Header account={account} />
      <PixelViewer />
    </main>
  )
}

export default App
