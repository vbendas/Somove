import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <div
      className={`rounded-card-lg p-5 sm:p-6 lg:p-8 ${
        hover
          ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          : ""
      } ${className}`}
      style={{
        background: "rgba(255,253,245,0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(212,165,116,0.1)",
      }}
    >
      {children}
    </div>
  );
}
