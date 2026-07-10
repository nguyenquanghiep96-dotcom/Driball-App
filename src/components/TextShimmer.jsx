import React, { useMemo } from "react";
import { motion } from "motion/react";

function TextShimmerComponent({
  children,
  as: Component = "p",
  className = "",
  duration = 2,
  spread = 2,
  baseColor,
  shimmerColor,
  style,
}) {
  const MotionComponent = motion.create(Component);

  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <MotionComponent
      className={className}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear",
      }}
      style={{
        ...style,
        position: "relative",
        display: "inline-block",
        backgroundSize: "250% 100%, auto",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundRepeat: "no-repeat",
        backgroundOrigin: "padding-box",
        "--spread": `${dynamicSpread}px`,
        "--base-color": baseColor ?? "color-mix(in oklab, currentColor 55%, transparent)",
        "--base-gradient-color": shimmerColor ?? "currentColor",
        "--bg": "linear-gradient(90deg, transparent calc(50% - var(--spread)), var(--base-gradient-color), transparent calc(50% + var(--spread)))",
        backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
      }}
    >
      {children}
    </MotionComponent>
  );
}

export const TextShimmer = React.memo(TextShimmerComponent);
