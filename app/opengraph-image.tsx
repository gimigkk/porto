import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "Gilang Muhamad Widiagung Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #09090b, #18181b, #000000)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.02em', marginRight: '24px' }}>GILANG MUHAMAD WIDIAGUNG</div>
          <div style={{ fontSize: 40, color: '#52525b', fontWeight: 300 }}>/</div>
          <div style={{ fontSize: 40, color: '#a1a1aa', fontWeight: 500, letterSpacing: '-0.01em', marginLeft: '24px' }}>Gimiaw</div>
        </div>
        
        <h1 
          style={{ 
            fontSize: 84, 
            fontWeight: 900, 
            color: '#ffffff', 
            lineHeight: 1.1, 
            letterSpacing: '-0.03em',
            marginBottom: '32px' 
          }}
        >
          Full-stack Developer &<br />Product Designer
        </h1>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px' }}>
          {['React', 'Next.js', 'TypeScript', 'Rust', 'Godot', 'Unity'].map((tech) => (
            <div 
              key={tech} 
              style={{ 
                display: 'flex',
                padding: '8px 24px', 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '999px',
                color: '#d4d4d8',
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: '-0.01em'
              }}
            >
              {tech}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
