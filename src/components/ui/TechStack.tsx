import { motion } from 'framer-motion';

interface Skill {
  name: string;
  level: number; // 0-100
  color: string;
}

export const TechStack = ({ skills }: { skills: Skill[] }) => {
  return (
    <div className="space-y-4 w-full">
      {skills.map((skill, idx) => (
        <div key={skill.name} className="relative">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-electric-blue">{skill.name}</span>
            <span className="text-xs text-text-tertiary">{skill.level}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${skill.level}%` }}
              transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
              className="h-full relative overflow-hidden"
              style={{ backgroundColor: skill.color }}
            >
              <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
};
