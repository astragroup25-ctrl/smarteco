import { Suspense } from 'react'
import PaiementContenu from './PaiementClient'

export const dynamic = 'force-dynamic'

export default function PaiementPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh' }} />}>
      <PaiementContenu />
    </Suspense>
  )
}
