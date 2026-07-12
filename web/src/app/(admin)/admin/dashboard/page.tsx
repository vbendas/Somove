import { getAdminStats } from "@/app/actions/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency } from "@/lib/format";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <PageContainer width="full">
      <PageHeader title="Dashboard" description="Overview of your platform." />

      <div className="space-y-6">

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Professionals</CardDescription>
            <CardTitle className="text-2xl">{stats.therapistCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Registered professionals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clients</CardDescription>
            <CardTitle className="text-2xl">{stats.clientCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Registered clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sessions</CardDescription>
            <CardTitle className="text-2xl">{stats.sessionCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(stats.totalRevenue, { showCents: true })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Platform fees collected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invites</CardTitle>
          <CardDescription>
            {stats.pendingInvites} invite{stats.pendingInvites !== 1 ? "s" : ""} awaiting
            acceptance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.pendingInvites > 0 ? (
            <p className="text-sm text-muted-foreground">
              Go to the{" "}
              <a href="/admin/invites" className="text-primary underline">
                Invites
              </a>{" "}
              page to manage pending invitations.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No pending invites. Send one from the{" "}
              <a href="/admin/invites" className="text-primary underline">
                Invites
              </a>{" "}
              page.
            </p>
          )}
        </CardContent>
      </Card>
      </div>
    </PageContainer>
  );
}
