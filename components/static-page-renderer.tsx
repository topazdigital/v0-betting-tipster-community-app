interface StaticPageRendererProps {
  title: string;
  body: string;
  updatedAt?: Date | string | null;
}

function renderBody(body: string): React.ReactNode {
  const blocks = body.split(/\n{2,}/);
  return blocks.map((block, idx) => {
    const lines = block.split('\n');
    const isList = lines.every((l) => l.trim().startsWith('- '));
    if (isList) {
      return (
        <ul key={idx} className="my-3 ml-5 list-disc space-y-1.5 text-muted-foreground">
          {lines.map((l, j) => (
            <li key={j}>{l.replace(/^\s*-\s+/, '')}</li>
          ))}
        </ul>
      );
    }
    if (lines.length === 1 && /^[A-Z][^.!?]*$/.test(lines[0]) && lines[0].length < 80) {
      return (
        <h2 key={idx} className="mt-6 text-xl font-semibold text-foreground">
          {lines[0]}
        </h2>
      );
    }
    return (
      <p key={idx} className="my-3 leading-7 text-muted-foreground">
        {lines.map((l, j) => (
          <span key={j}>
            {l}
            {j < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

export function StaticPageRenderer({ title, body, updatedAt }: StaticPageRendererProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
        {updatedAt && (
          <p className="mt-2 text-xs text-muted-foreground">
            Last updated{' '}
            {new Date(updatedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
      </header>
      <div className="prose-sm">{renderBody(body)}</div>
    </article>
  );
}
