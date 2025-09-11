import * as React from "react";
import { cn } from "@/lib/utils";

const BentoCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    Icon?: React.ComponentType<{ className?: string }>;
    name?: string;
    description?: string;
    href?: string;
    cta?: string;
    background?: React.ReactNode;
  }
>(
  (
    {
      className,
      Icon,
      name,
      description,
      href,
      cta,
      background,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative flex flex-col justify-between overflow-hidden rounded-xl",
          "bg-white dark:bg-gray-900",
          "border border-gray-200 dark:border-gray-800",
          "shadow-sm hover:shadow-md transition-shadow duration-300",
          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent",
          "dark:before:from-primary/10 dark:before:to-transparent",
          // Responsive column spans
          "col-span-1 sm:col-span-1 lg:col-span-1",
          className
        )}
        {...props}
      >
        <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1">
          {Icon && (
            <div className="h-12 w-12 origin-left transform-gpu text-primary transition-all duration-300 ease-in-out group-hover:scale-110">
              <Icon className="h-8 w-8" />
            </div>
          )}
          {name && (
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {name}
            </h3>
          )}
          {description && (
            <p className="max-w-lg text-sm text-gray-600 dark:text-gray-300">
              {description}
            </p>
          )}
        </div>

        {background && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 top-0 overflow-hidden rounded-xl">
            {background}
          </div>
        )}

        {href && cta && (
          <div className="pointer-events-auto z-10 p-6">
            <a
              href={href}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {cta}
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
    );
  }
);
BentoCard.displayName = "BentoCard";

const BentoGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full",
        "auto-rows-[16rem] sm:auto-rows-[18rem] lg:auto-rows-[20rem]",
        className
      )}
      {...props}
    />
  );
});
BentoGrid.displayName = "BentoGrid";

export { BentoCard, BentoGrid };
