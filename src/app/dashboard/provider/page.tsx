import { redirect } from "next/navigation";

export default async function ProviderDashboardPage({
  searchParams: _searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  void _searchParams;
  redirect("/dashboard/client");
}
