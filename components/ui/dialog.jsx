"use client"

import * as React from "react"
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Custom scrollbar styles
const scrollbarStyles = `
  .dialog-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .dialog-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    margin: 8px 0;
  }
  
  .dialog-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 100px;
  }
  
  .dialog-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
  
  /* Firefox scrollbar */
  .dialog-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db transparent;
  }
`;

/**
 * Dialog Root component
 * Wraps Radix's Root, which manages open/close state for the dialog.
 */
function Dialog({
  ...props
}) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

/**
 * DialogTrigger component
 * Element that triggers the opening of the dialog (like a button).
 */
function DialogTrigger({
  ...props
}) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

/**
 * DialogPortal component
 * Portal to render dialog content outside of the DOM hierarchy.
 * Useful for overlay and modal layering.
 */
function DialogPortal({
  ...props
}) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

/**
 * DialogClose component
 * Button or element to close the dialog.
 */
function DialogClose({
  ...props
}) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/**
 * DialogOverlay component
 * The semi-transparent backdrop overlay behind the dialog.
 * Enhanced with better blur and transition for desktop.
 */
function DialogOverlay({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-white bg-opacity-50 backdrop-blur-lg transition-all duration-300",
        className
      )}
      {...props} />
  );
}

/**
 * DialogContent component
 * Enhanced for desktop with better sizing, smoother animations, and improved close button.
 * New props:
 * - size: 'sm' | 'md' | 'lg' | 'xl' | 'full' - Controls max width (default: 'lg' = max-w-5xl = ~1024px)
 * - showCloseButton: boolean - Toggle close button visibility
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = "lg",
  ...props
}) {
  const sizeClasses = {
    sm: "sm:max-w-xl",
    md: "sm:max-w-3xl",
    lg: "sm:max-w-5xl",
    xl: "sm:max-w-7xl",
    full: "sm:max-w-[95vw]"
  };

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%] fixed top-[50%] left-[50%] z-50 flex flex-col w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] rounded-xl border shadow-2xl duration-300 sm:rounded-2xl max-h-[85vh] sm:max-h-[80vh]",
          sizeClasses[size],
          className
        )}
        {...props}>
        <div className="overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
          {children}
        </div>
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring absolute top-4 right-4 sm:top-6 sm:right-6 rounded-lg opacity-60 transition-all hover:opacity-100 hover:bg-accent hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none p-2 sm:p-2.5 z-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-5">
            <X />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/**
 * DialogHeader component
 * Enhanced spacing and typography for desktop.
 */
function DialogHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 sm:gap-3 text-center sm:text-left", className)}
      {...props} />
  );
}

/**
 * DialogFooter component
 * Enhanced spacing and button layout for desktop.
 */
function DialogFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 mt-2", className)}
      {...props} />
  );
}

/**
 * DialogTitle component
 * Enhanced typography scaling for desktop.
 */
function DialogTitle({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg sm:text-xl lg:text-2xl leading-tight font-semibold tracking-tight", className)}
      {...props} />
  );
}

/**
 * DialogDescription component
 * Enhanced typography for better readability on desktop.
 */
function DialogDescription({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm sm:text-base leading-relaxed", className)}
      {...props} />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}