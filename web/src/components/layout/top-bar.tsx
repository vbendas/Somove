"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  avatarSrc?: string;
  avatarFallback?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  onAvatarClick?: () => void;
  className?: string;
}

export function TopBar({
  title,
  showBack = false,
  onBack,
  avatarSrc,
  avatarFallback = "U",
  notificationCount = 0,
  onNotificationClick,
  onAvatarClick,
  className,
}: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "pt-[env(safe-area-inset-top)]",
        className
      )}
    >
      <div className="flex h-14 items-center px-4">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="mr-2 h-9 w-9"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {title && (
          <h1 className="flex-1 truncate font-heading text-lg font-medium">
            {title}
          </h1>
        )}

        <div className="ml-auto flex items-center gap-2">
          {onNotificationClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNotificationClick}
              className="relative h-9 w-9"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Button>
          )}

          {onAvatarClick && (
            <button
              onClick={onAvatarClick}
              className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarSrc} alt="User avatar" />
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
