import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  message?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingState({ 
  message = "Loading...", 
  className,
  size = "md" 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "gap-2 text-sm",
    md: "gap-3 text-base", 
    lg: "gap-4 text-lg"
  }

  const spinnerSizes = {
    sm: "size-3",
    md: "size-4",
    lg: "size-5"
  }

  return (
    <div className={cn(
      "flex items-center justify-center text-muted-foreground",
      sizeClasses[size],
      className
    )}>
      <Spinner className={spinnerSizes[size]} />
      <span>{message}</span>
    </div>
  )
}

export function LoadingCard({ 
  message = "Loading...", 
  className 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <div className={cn(
      "flex items-center justify-center p-8 border rounded-lg bg-card",
      className
    )}>
      <LoadingState message={message} />
    </div>
  )
}