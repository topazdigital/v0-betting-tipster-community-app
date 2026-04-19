"use client"

import { useState } from "react"
import { Search, Download, DollarSign, TrendingUp, CreditCard, Users, CheckCircle2, Clock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, subDays } from "date-fns"

const transactions = Array.from({ length: 30 }, (_, i) => ({
  id: `TXN${String(i + 1).padStart(6, '0')}`,
  user: {
    name: `User${i + 1}`,
    email: `user${i + 1}@example.com`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`
  },
  type: ["subscription", "deposit", "withdrawal", "refund"][i % 4],
  amount: (10 + Math.random() * 200).toFixed(2),
  status: i % 5 === 0 ? "pending" : i % 7 === 0 ? "failed" : "completed",
  method: ["Credit Card", "PayPal", "Crypto", "Bank Transfer"][i % 4],
  date: subDays(new Date(), i)
}))

export default function AdminPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredTransactions = transactions.filter(txn => {
    if (searchQuery && !txn.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !txn.user.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (typeFilter !== "all" && txn.type !== typeFilter) return false
    if (statusFilter !== "all" && txn.status !== statusFilter) return false
    return true
  })

  const stats = {
    totalRevenue: transactions.filter(t => t.type !== "withdrawal" && t.type !== "refund" && t.status === "completed")
      .reduce((acc, t) => acc + parseFloat(t.amount), 0),
    subscriptions: transactions.filter(t => t.type === "subscription").length,
    pending: transactions.filter(t => t.status === "pending").length,
    activeUsers: 1284
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments & Transactions</h1>
          <p className="text-muted-foreground">Manage payments and view transaction history</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-500">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscriptions</p>
                <p className="text-2xl font-bold">{stats.subscriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Subscribers</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="all">All Types</option>
                <option value="subscription">Subscription</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="refund">Refund</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">Transaction ID</th>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Method</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="p-4 font-mono text-sm">{txn.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={txn.user.avatar} alt={txn.user.name} className="h-8 w-8 rounded-full" />
                        <div>
                          <p className="font-medium">{txn.user.name}</p>
                          <p className="text-xs text-muted-foreground">{txn.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize">{txn.type}</Badge>
                    </td>
                    <td className="p-4">
                      <span className={
                        txn.type === "withdrawal" || txn.type === "refund" 
                          ? "text-red-500" 
                          : "text-emerald-500"
                      }>
                        {txn.type === "withdrawal" || txn.type === "refund" ? "-" : "+"}${txn.amount}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{txn.method}</td>
                    <td className="p-4">
                      <Badge 
                        variant={txn.status === "completed" ? "default" : txn.status === "failed" ? "destructive" : "secondary"}
                        className={txn.status === "completed" ? "bg-emerald-500" : ""}
                      >
                        {txn.status === "completed" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {txn.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                        {txn.status === "failed" && <XCircle className="mr-1 h-3 w-3" />}
                        {txn.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(txn.date, "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
