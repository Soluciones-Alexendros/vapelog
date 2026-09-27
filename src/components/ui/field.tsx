import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="block">
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export { Field };
