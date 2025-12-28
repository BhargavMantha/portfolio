import { useUniverseStore } from '../../store/universeStore';
import { PIT_STOPS } from '../../constants/pitStops';
import { SectionType } from '../../types/island';

export const Navbar = () => {
  const currentUniverse = useUniverseStore((state) => state.currentUniverse);
  const initiateFlightTo = useUniverseStore((state) => state.initiateFlightTo);

  const handleSectionClick = (sectionId: SectionType) => {
    // Only initiate flight if clicking a different universe
    if (sectionId !== currentUniverse) {
      initiateFlightTo(sectionId);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center mt-8">
      <div className="glass-panel px-8 py-4 flex items-center gap-6">
        <div className="text-white font-bold text-xl">BM</div>

        <div className="flex gap-6">
          {Object.values(PIT_STOPS).map((pitStop) => (
            <button
              key={pitStop.id}
              onClick={() => handleSectionClick(pitStop.id)}
              className={`
                text-sm font-medium transition-all duration-300
                ${
                  currentUniverse === pitStop.id
                    ? 'text-accent-cyan scale-105'
                    : 'text-neutral-gray hover:text-white'
                }
              `}
              style={{
                textShadow:
                  currentUniverse === pitStop.id
                    ? `0 0 10px ${pitStop.color}`
                    : 'none',
              }}
            >
              {pitStop.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
