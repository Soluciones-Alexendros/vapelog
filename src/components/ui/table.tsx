import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <table
      data-slot="table"
      className={cn("w-full border-collapse text-left text-sm", className)}
      {...props}
    />
  );
}

function TableHeader(props: ComponentProps<"thead">) {
  return <thead data-slot="table-header" className="bg-muted text-muted-foreground" {...props} />;
}

function TableBody(props: ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" {...props} />;
}

function TableRow(props: ComponentProps<"tr">) {
  return <tr data-slot="table-row" className="border-t border-border align-top" {...props} />;
}

function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn("px-3 py-3 font-medium", className)}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-3 py-3 text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
