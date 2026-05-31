import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

const paddingStyles = {
  none: "",
  sm: "px-4 py-4",
  md: "px-5 py-5 sm:px-6 sm:py-6",
  lg: "px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10",
};

const maxWidthStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-7xl",
};

export function PageContainer({
  children,
  className,
  padding = "md",
  maxWidth = "full",
}: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full",
        "pb-20",
        maxWidthStyles[maxWidth],
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </main>
  );
}
