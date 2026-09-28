import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function AppNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-4xl text-foreground">Página no encontrada</h1>
      <p className="mt-3 text-muted-foreground">
        El archivo no tiene esa ruta. Puede que el enlace esté anticuado o mal escrito.
      </p>
      <Button asChild variant="secondary" className="mt-6">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
