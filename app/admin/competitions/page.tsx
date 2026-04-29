"use client"

import { Trophy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminCompetitionsPage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-bold">Competitions</h1>
        <p className="text-xs text-muted-foreground">Prediction competitions and tournaments</p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <Trophy className="mx-auto h-10 w-10 text-amber-500/60" />
          <h2 className="mt-3 text-base font-semibold">No competitions yet</h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
            Competitions let you run weekly or monthly prediction tournaments with prizes.
            We&apos;ll wire this up once the database table is provisioned — check the matches and tipsters pages for now.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/matches">Manage matches</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/tipsters">View tipsters</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
