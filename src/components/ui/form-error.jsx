import * as React from "react"
import { cn } from "@/lib/utils"

const FormError = React.forwardRef(({ id, children, className, ...props }, ref) => {
  if (!children) return null
  return (
    <div
      ref={ref}
      id={id}
      role="alert"
      className={cn("p-3 rounded-lg bg-destructive/10 text-destructive text-sm", className)}
      {...props}
    >
      {children}
    </div>
  )
})
FormError.displayName = "FormError"

export { FormError }