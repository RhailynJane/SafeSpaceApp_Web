"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

const variants = {
  default: { icon: Info, iconClass: "text-emerald-600", headerClass: "" },
  success: { icon: CheckCircle2, iconClass: "text-emerald-600", headerClass: "" },
  warning: { icon: AlertTriangle, iconClass: "text-amber-600", headerClass: "" },
  error: { icon: XCircle, iconClass: "text-red-600", headerClass: "" },
};

export function Modal({ open, onOpenChange, title, children, footer, variant = "default", size = "md" }) {
  const v = variants[variant] || variants.default;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-2xl" : "sm:max-w-xl"}>
        {(title || variant !== "default") && (
          <DialogHeader className={v.headerClass}>
            <DialogTitle className="flex items-center gap-2">
              {variant !== "default" ? <v.icon className={`h-5 w-5 ${v.iconClass}`} /> : null}
              {title}
            </DialogTitle>
          </DialogHeader>
        )}
        <div className="mt-2">{children}</div>
        {footer ? <div className="mt-4 flex justify-end gap-2">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmModal({ open, onOpenChange, title = "Confirm", description, confirmText = "Confirm", cancelText = "Cancel", onConfirm, loading = false, variant = "default" }) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      variant={variant}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>{cancelText}</Button>
          <Button onClick={onConfirm} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {loading ? "Please wait…" : confirmText}
          </Button>
        </>
      }
    >
      {typeof description === "string" ? <p className="text-sm text-muted-foreground">{description}</p> : description}
    </Modal>
  );
}

export function StatusModal({ open, onOpenChange, status = "success", title, message }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} variant={status}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => onOpenChange?.(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white">Close</Button>
      </div>
    </Modal>
  );
}
