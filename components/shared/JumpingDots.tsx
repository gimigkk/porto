export default function JumpingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            display: 'block',
            transformOrigin: 'bottom',
            animation: `ssrDotJump 0.8s infinite -${0.3 - i * 0.15}s, ssrDotFade 0.8s infinite -${0.3 - i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
