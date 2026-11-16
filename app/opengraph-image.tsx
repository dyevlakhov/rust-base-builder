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
        background: 'linear-gradient(160deg, #2a2c25 0%, #1e201b 60%, #171913 100%)',
        color: '#e8e1d0',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          fontSize: 28,
          color: '#f2a93b',
        }}
      >
        <div style={{ width: 56, height: 6, background: '#f2a93b', borderRadius: 2 }} />A 3D base
        planner for Rust
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
          color: 'rgba(232,225,208,0.72)',
        }}
      >
        Every piece snaps to a socket the way it does in the game. See the stability and the cost
        before you spend anything.
      </div>

      <div style={{ display: 'flex', gap: '14px', marginTop: 48 }}>
        {['Twig', 'Wood', 'Stone', 'Sheet Metal', 'Armored'].map((tier, index) => (
          <div
            key={tier}
            style={{
              display: 'flex',
              padding: '12px 22px',
              borderRadius: 3,
              fontSize: 24,
              color: '#e8e1d0',
              fontWeight: 600,
              border: index === 2 ? '2px solid #f2a93b' : '2px solid rgba(0,0,0,0.35)',
              background: ['#8f7a5c', '#6e5238', '#6f6b64', '#5e5f60', '#3a3d40'][index],
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
