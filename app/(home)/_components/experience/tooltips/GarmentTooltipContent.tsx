export function GarmentTooltipContent({ name }: { name: string }) {
  return (
    <div className="min-w-max px-3.5 py-2">
      <p className="text-xs font-semibold text-neutral-900 whitespace-nowrap">
        {name}
      </p>
    </div>
  );
}
