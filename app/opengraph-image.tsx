import { ImageResponse } from 'next/og'

export const alt = 'Rust Base Builder — plan your Rust base in 3D'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Social preview card, drawn at request time rather than checked in as a PNG.
 * Nothing here loads a font or an image, so it needs no assets and cannot 404.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: 'linear-gradient(135deg, #111827 0%, #1f2937 55%, #2b2018 100%)',
        color: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          fontSize: 26,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: '#fb923c',
        }}
      >
        <div style={{ width: 56, height: 6, background: '#fb923c', borderRadius: 3 }} />
        Base planner
      </div>

      <div style={{ display: 'flex', fontSize: 92, fontWeight: 700, marginTop: 28 }}>
        Rust Base Builder
      </div>

      <div
        style={{
          display: 'flex',
          fontSize: 34,
          marginTop: 22,
          maxWidth: 880,
          lineHeight: 1.35,
          color: 'rgba(255,255,255,0.72)',
        }}
      >
        Lay out foundations, walls and floors on the game&apos;s 3 m grid — and see what the design
        costs before you spend anything.
      </div>

      <div style={{ display: 'flex', gap: '14px', marginTop: 48 }}>
        {['Twig', 'Wood', 'Stone', 'Sheet Metal', 'Armored'].map((tier, index) => (
          <div
            key={tier}
            style={{
              display: 'flex',
              padding: '12px 22px',
              borderRadius: 12,
              fontSize: 24,
              color: '#0b0f16',
              fontWeight: 600,
              background: ['#C4A484', '#8A6244', '#8E8B85', '#9FB2CC', '#6E8A6E'][index],
            }}
          >
            {tier}
          </div>
        ))}
      </div>
    </div>,
    size
  )
}
