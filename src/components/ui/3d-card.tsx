"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the InteractiveTravelCard component.
 */
export interface InteractiveTravelCardProps {
  /** The main title for the card, e.g., "Sapa Valley" */
  title: string;
  /** A subtitle or location, e.g., "Vietnam" */
  subtitle: string;
  /** The URL for the background image. */
  imageUrl: string;
  /** The text for the primary action button, e.g., "Book your trip" */
  actionText: string;
  /** The destination URL for the top-right link. */
  href: string;
  /** Callback function when the primary action button is clicked. */
  onActionClick: () => void;
  /** Optional additional class names for custom styling. */
  className?: string;
}

/**
 * A responsive and theme-adaptive travel card with a 3D tilt effect on hover.
 */
export const InteractiveTravelCard = React.forwardRef<
  HTMLDivElement,
  InteractiveTravelCardProps
>(
  (
    { title, subtitle, imageUrl, actionText, href, onActionClick, className },
    ref
  ) => {
    // --- 3D Tilt Animation Logic ---
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 15, stiffness: 150 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    const rotateX = useTransform(springY, [-0.5, 0.5], ["10.5deg", "-10.5deg"]);
    const rotateY = useTransform(springX, [-0.5, 0.5], ["-10.5deg", "10.5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const { width, height, left, top } = rect;
      const mouseXVal = e.clientX - left;
      const mouseYVal = e.clientY - top;
      const xPct = mouseXVal / width - 0.5;
      const yPct = mouseYVal / height - 0.5;
      mouseX.set(xPct);
      mouseY.set(yPct);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative h-[26rem] w-80 rounded-2xl bg-transparent shadow-2xl border border-border/30",
          className
        )}
      >
        <div
          className="absolute inset-4 grid h-[calc(100%-2rem)] w-[calc(100%-2rem)] grid-rows-[1fr_auto] rounded-xl shadow-lg"
        >
          {/* Background Image */}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <img
              src={imageUrl}
              alt={`${title}, ${subtitle}`}
              className="absolute inset-0 h-full w-full rounded-xl object-cover"
            />
          </div>
          
          {/* Darkening overlay for better text contrast over the image */}
          <div className="absolute inset-0 h-full w-full rounded-xl bg-gradient-to-b from-black/30 via-black/10 to-black/70" />

          {/* Card Content (Header & Footer) */}
          <div className="relative flex flex-col justify-between rounded-xl p-4 text-white h-full">
            
            {/* Header section with text and link */}
            <div className="flex items-start justify-between">
              <div>
                <motion.h2 
                  className="text-2xl font-bold"
                >
                  {title}
                </motion.h2>
                <motion.p 
                  className="text-sm font-light text-white/80 mt-1"
                >
                  {subtitle}
                </motion.p>
              </div>
              <motion.a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, rotate: "2.5deg" }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Learn more about ${title}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-inset ring-white/30 transition-colors hover:bg-white/30 shrink-0 relative z-20 cursor-pointer"
              >
                <ArrowUpRight className="h-5 w-5 text-white" />
              </motion.a>
            </div>

            {/* Footer Button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onActionClick();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "w-full rounded-lg py-3 text-center font-semibold text-white transition-colors cursor-pointer relative z-20",
                "bg-white/10 backdrop-blur-md ring-1 ring-inset ring-white/20 hover:bg-white/20"
              )}
            >
              {actionText}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }
);
InteractiveTravelCard.displayName = "InteractiveTravelCard";
