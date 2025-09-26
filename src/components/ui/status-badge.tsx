import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        submitted: "bg-blue-50 text-blue-700 border border-blue-200",
        "in-progress": "bg-amber-50 text-amber-700 border border-amber-200", 
        resolved: "bg-green-50 text-green-700 border border-green-200",
        closed: "bg-gray-50 text-gray-700 border border-gray-200",
        rejected: "bg-red-50 text-red-700 border border-red-200",
        pending: "bg-orange-50 text-orange-700 border border-orange-200",
        approved: "bg-emerald-50 text-emerald-700 border border-emerald-200"
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-xs", 
        lg: "px-4 py-1.5 text-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: React.ComponentType<{ className?: string }>
  pulse?: boolean
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, size, icon: Icon, pulse, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(statusBadgeVariants({ variant, size }), className)}
        {...props}
      >
        {Icon && (
          <Icon className={cn("h-3 w-3", pulse && "animate-pulse")} />
        )}
        {children}
      </span>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

// Predefined status components for common use cases
const SubmittedBadge = ({ children, ...props }: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="submitted" {...props}>
    <div className="h-2 w-2 rounded-full bg-blue-500" />
    {children || "Submitted"}
  </StatusBadge>
)

const InProgressBadge = ({ children, ...props }: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="in-progress" {...props}>
    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
    {children || "In Progress"}
  </StatusBadge>
)

const ResolvedBadge = ({ children, ...props }: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="resolved" {...props}>
    <div className="h-2 w-2 rounded-full bg-green-500" />
    {children || "Resolved"}
  </StatusBadge>
)

const ClosedBadge = ({ children, ...props }: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="closed" {...props}>
    <div className="h-2 w-2 rounded-full bg-gray-500" />
    {children || "Closed"}
  </StatusBadge>
)

const PendingBadge = ({ children, ...props }: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="pending" {...props}>
    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
    {children || "Pending"}
  </StatusBadge>
)

const ApprovedBadge = ({ children, ...props }: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="approved" {...props}>
    <div className="h-2 w-2 rounded-full bg-emerald-500" />
    {children || "Approved"}
  </StatusBadge>
)

const RejectedBadge = ({ children, ...props }: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="rejected" {...props}>
    <div className="h-2 w-2 rounded-full bg-red-500" />
    {children || "Rejected"}
  </StatusBadge>
)

export { 
  StatusBadge, 
  statusBadgeVariants,
  SubmittedBadge,
  InProgressBadge,
  ResolvedBadge,
  ClosedBadge,
  PendingBadge,
  ApprovedBadge,
  RejectedBadge
}
