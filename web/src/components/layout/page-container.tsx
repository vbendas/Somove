import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  /** narrow = max-w-2xl (default), wide = max-w-4xl, full = max-w-7xl */
  width?: "narrow" | "wide" | "full";
  /** Adds min-h-screen bg-background — for routes with no group layout (login, onboarding). */
  standalone?: boolean;
  className?: string;
}

const widthStyles = {
  narrow: "max-w-2xl",
  wide: "max-w-4xl",
  full: "max-w-7xl",
};

export function PageContainer({
  children,
  width = "narrow",
  standalone = false,
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 py-8 sm:px-6",
        widthStyles[width],
        standalone && "min-h-screen bg-background",
        className
      )}
    >
      {children}
    </div>
  );
}
