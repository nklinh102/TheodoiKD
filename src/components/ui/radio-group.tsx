"use client"

import * as React from "react"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

// Simple Context to share value
const RadioGroupContext = React.createContext<{
    value?: string
    onValueChange?: (value: string) => void
    name?: string
} | null>(null)

const RadioGroup = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value?: string; onValueChange?: (value: string) => void; name?: string }
>(({ className, value, onValueChange, name, ...props }, ref) => {
    return (
        <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
            <div className={cn("grid gap-2", className)} {...props} ref={ref} />
        </RadioGroupContext.Provider>
    )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value: itemValue, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    const isChecked = context?.value === itemValue

    return (
        <button
            type="button"
            role="radio"
            aria-checked={isChecked}
            data-state={isChecked ? "checked" : "unchecked"}
            value={itemValue}
            className={cn(
                "aspect-square h-4 w-4 rounded-full border border-slate-200 border-slate-900 text-slate-900 ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:border-slate-50 dark:text-slate-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300",
                className
            )}
            onClick={() => context?.onValueChange?.(itemValue)}
            ref={ref}
            {...props}
        >
            {isChecked && (
                <span className="flex items-center justify-center">
                    <Circle className="h-2.5 w-2.5 fill-current text-current" />
                </span>
            )}
        </button>
    )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
