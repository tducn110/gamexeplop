export function BackgroundScreen() {
  return (
    <div
      id="parallax-wrapper"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        pointerEvents: 'none',
        zIndex: -2,
        transform: 'translateY(0px)', // Will be updated by PixiGameStage
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: '100%',
          height: '10000vh',
          bottom: 'calc(100% - 2px)',
          backgroundImage: "url('/assets/BackgroundSky.png')",
          backgroundSize: '100% auto',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'repeat-y',
        }}
      />
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <picture style={{ display: 'block', width: '100%' }}>
          <source media="(min-width: 768px)" srcSet="/assets/Background.png" />
          <img src="/assets/backgroundphone.png" alt="ground" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </picture>
      </div>
    </div>
  );
}
