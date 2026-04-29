'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Calendar, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function ArticleReader() {
  const params = useSearchParams();
  const router = useRouter();

  const headline = params.get('headline') || '';
  const description = params.get('description') || '';
  const image = params.get('image') || '';
  const published = params.get('published') || '';
  const sourceUrl = params.get('source_url') || '';
  const source = params.get('source') || 'ESPN';

  if (!headline) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <Newspaper className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h1 className="mt-4 text-2xl font-bold">Article not found</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn&apos;t load this article. It may have been removed or the link is broken.
        </p>
        <Button className="mt-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    );
  }

  // Format the published date in a human-friendly way.
  const publishedLabel = published
    ? new Date(published).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // Pull a few sentences out of the description to render as the article body.
  // ESPN's match-news API exposes a short description rather than the full
  // article body, so we render that here and link to the original story for
  // readers who want the full piece.
  const bodyParagraphs = description
    .split(/(?<=[.!?])\s+/)
    .reduce<string[]>((acc, sentence) => {
      const last = acc[acc.length - 1];
      if (!last || last.length > 220) acc.push(sentence);
      else acc[acc.length - 1] = `${last} ${sentence}`;
      return acc;
    }, []);

  return (
    <article className="mx-auto max-w-2xl px-3 py-4">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-3 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back
      </button>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-tight">
        <Badge variant="secondary" className="gap-1 h-5 px-1.5 text-[9px] font-bold">
          <Newspaper className="h-2.5 w-2.5" />
          {source}
        </Badge>
        {publishedLabel && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" />
            {publishedLabel}
          </span>
        )}
      </div>

      <h1 className="mb-4 text-balance text-xl font-bold tracking-tight sm:text-2xl leading-tight">
        {headline}
      </h1>

      {image && (
        <div className="mb-4 overflow-hidden rounded-xl">
          <Image
            src={image}
            alt={headline}
            width={800}
            height={450}
            unoptimized
            className="h-auto w-full object-cover"
          />
        </div>
      )}

      <div className="prose prose-sm max-w-none text-foreground leading-snug">
        {bodyParagraphs.length > 0 ? (
          bodyParagraphs.map((p, i) => (
            <p key={i} className="mb-3 text-[13px] text-foreground/90">
              {p}
            </p>
          ))
        ) : (
          <p className="text-xs text-muted-foreground italic">No preview available for this story.</p>
        )}
      </div>

      {sourceUrl && (
        <Card className="mt-6 border-primary/20 bg-primary/5 rounded-lg">
          <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight">Full story available</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Read the complete article on the original source.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-[11px]">
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                Read on {source}
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 border-t border-border pt-4 text-center">
        <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-muted-foreground">
          <Link href="/matches">Back to matches</Link>
        </Button>
      </div>
    </article>
  );
}

export default function NewsArticlePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-12 text-center text-muted-foreground">
          Loading article…
        </div>
      }
    >
      <ArticleReader />
    </Suspense>
  );
}
