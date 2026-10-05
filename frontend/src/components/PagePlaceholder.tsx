interface PagePlaceholderProps {
  title: string;
  description: string;
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-gray-500">{description}</p>
    </div>
  );
}
