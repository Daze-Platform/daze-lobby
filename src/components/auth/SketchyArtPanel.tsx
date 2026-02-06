import { motion } from "framer-motion";

// Brand Colors
const BRAND = {
  ocean: "#0EA5E9",
  sunset: "#F97316",
};

// Sketchy cloud component with dashed stroke
function SketchyCloud({ 
  className, 
  delay = 0,
  direction = 1,
}: { 
  className?: string; 
  delay?: number;
  direction?: 1 | -1;
}) {
  return (
    <motion.svg
      viewBox="0 0 200 100"
      className={className}
      initial={{ x: 0 }}
      animate={{ x: direction * 30 }}
      transition={{
        duration: 8,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay,
      }}
    >
      {/* Sketchy cloud path with dashed stroke */}
      <path
        d="M40 70 
           Q20 70 20 55 
           Q20 40 40 40 
           Q45 25 65 25 
           Q85 20 100 30 
           Q120 15 145 30 
           Q175 25 180 50 
           Q190 50 190 60 
           Q190 75 170 75 
           L40 75 Z"
        fill="white"
        stroke="#1e293b"
        strokeWidth="3"
        strokeDasharray="8 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

// Sketchy sun with rough edges
function SketchySun() {
  return (
    <motion.div
      className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
      initial={{ y: "60%" }}
      animate={{ y: "50%" }}
      transition={{
        duration: 2,
        ease: "easeOut",
      }}
    >
      <svg
        width="400"
        height="400"
        viewBox="0 0 400 400"
        className="w-[300px] h-[300px] md:w-[400px] md:h-[400px]"
      >
        {/* Rough sun circle with hand-drawn effect */}
        <path
          d="M200 20
             Q230 18 260 25
             Q310 35 345 70
             Q375 105 382 150
             Q388 195 378 240
             Q365 290 330 330
             Q290 370 240 382
             Q195 390 150 378
             Q100 362 65 325
             Q30 285 22 235
             Q15 185 28 140
             Q45 90 90 55
             Q135 25 180 20
             Q190 19 200 20
             Z"
          fill={BRAND.sunset}
          stroke="#ea580c"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Sun rays - sketchy lines */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const innerRadius = 180;
          const outerRadius = 220 + (i % 2) * 20;
          const x1 = 200 + Math.cos(angle) * innerRadius;
          const y1 = 200 + Math.sin(angle) * innerRadius;
          const x2 = 200 + Math.cos(angle) * outerRadius;
          const y2 = 200 + Math.sin(angle) * outerRadius;
          
          return (
            <motion.line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#ea580c"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="6 8"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: 1, pathLength: 1 }}
              transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

export function SketchyArtPanel() {
  return (
    <div 
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: BRAND.ocean }}
    >
      {/* Floating clouds */}
      <SketchyCloud 
        className="absolute top-[10%] left-[5%] w-32 md:w-40" 
        delay={0}
        direction={1}
      />
      <SketchyCloud 
        className="absolute top-[25%] right-[10%] w-36 md:w-48" 
        delay={1.5}
        direction={-1}
      />
      <SketchyCloud 
        className="absolute top-[45%] left-[15%] w-28 md:w-36" 
        delay={2.5}
        direction={1}
      />
      <SketchyCloud 
        className="absolute top-[15%] left-[40%] w-24 md:w-32" 
        delay={3}
        direction={-1}
      />

      {/* Rising Sun */}
      <SketchySun />
      
      {/* Tagline */}
      <motion.div
        className="absolute top-8 left-8 right-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
          A brighter day awaits.
        </h2>
        <p className="text-white/70 mt-2 text-sm md:text-base">
          Effortless service, floating on air.
        </p>
      </motion.div>
    </div>
  );
}
