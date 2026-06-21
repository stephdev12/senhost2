"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InteractiveProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  logoUrl?: string;
  title: string;
  description: string;
  price: string;
}

export function InteractiveProductCard({
  className,
  imageUrl,
  logoUrl,
  title,
  description,
  price,
  ...props
}: InteractiveProductCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    const rotateX = (y - height / 2) / (height / 2) * -8;
    const rotateY = (x - width / 2) / (width / 2) * 8;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
      transition: "transform 0.1s ease-out",
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.4s ease-in-out",
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={cn(
        "relative w-full max-w-[340px] aspect-[9/12] rounded-3xl bg-card shadow-lg",
        "[transform-style:preserve-3d]",
        className
      )}
      {...props}
    >
      {/* Background Image (Blurred backdrop style) */}
      <div
        className="absolute inset-0 overflow-hidden rounded-3xl"
        style={{ transform: "translateZ(-20px) scale(1.1)" }}
      >
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 blur-[8px] scale-110"
        />
      </div>
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-3xl" />

      {/* Main Content with 3D effect */}
      <div
        className="absolute inset-0 p-5 flex flex-col"
        style={{ transform: "translateZ(40px)" }}
      >
        {/* Glassmorphism Header */}
        <div className="flex items-start justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-xs text-white/70">{description}</p>
          </div>
          {logoUrl && (
            <img src={logoUrl} alt="Brand Logo" className="h-4 w-auto" />
          )}
        </div>

        {/* Price Tag */}
        <div className="absolute top-[108px] left-5">
          <div className="rounded-full bg-black/40 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
            {price}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="mt-auto flex w-full justify-center gap-2 pb-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                index === 0 ? "bg-white" : "bg-white/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
