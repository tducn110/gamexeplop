export function BackgroundScreen() {
  return (
    <div
      id="parallax-wrapper"
      className="absolute bottom-0 left-0 w-full pointer-events-none"
      style={{
        zIndex: -2,
        transform: 'translateY(0px)', // Will be updated by PixiGameStage
      }}
    >
      <div
        className="absolute bottom-full left-0 w-full h-[10000vh]"
        style={{
          backgroundImage: 'url(/assets/sky_combined.png)',
          backgroundSize: '100% auto',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'repeat-y',
        }}
      />
      <div className="w-full flex flex-col">
        <picture className="block w-full">
          <source media="(min-width: 768px)" srcSet="/assets/Background.png" />
          <img src="/assets/backgroundphone.png" alt="ground" className="w-full h-auto block" />
        </picture>
      </div>
    </div>
  );
}
