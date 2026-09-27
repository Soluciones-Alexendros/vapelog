import { createFileRoute } from "@tanstack/react-router";
import { ArchiveTable } from "@/components/archive-table";

export const Route = createFileRoute("/archivo")({
  component: ArchiveTable,
});
