import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  console.error(error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
      <span className="text-destructive" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">Algo salió mal</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Ocurrió un error inesperado. Recarga la página.
      </p>
      <Button asChild variant="secondary" className="mt-2">
        <Link to="/">vuelve al inicio</Link>
      </Button>
    </main>
  );
}
