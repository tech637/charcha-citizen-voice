"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2",
        className
      )}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onMouseEnter: () => setHoveredIndex(index),
            onMouseLeave: () => setHoveredIndex(null),
            className: cn(
              "transition-all duration-200 ease-in-out",
              hoveredIndex === index ? "scale-[1.02]" : "scale-100"
            ),
          } as any);
        }
        return child;
      })}
    </div>
  );
}
