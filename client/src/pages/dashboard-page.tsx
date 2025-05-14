import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardCards from "@/components/dashboard/dashboard-cards";
import RecentOrders from "@/components/dashboard/recent-orders";
import FinancialOverview from "@/components/dashboard/financial-overview";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch orders for dashboard
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });
  
  // Fetch organization data
  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ["/api/organization"],
  });

  const isLoading = ordersLoading || orgLoading;

  return (
    <AppShell currentModule="dashboard">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {isLoading ? (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <div className="mt-8">
                  <Skeleton className="h-8 w-64 mb-4" />
                  <Skeleton className="h-64 w-full" />
                </div>
                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              </>
            ) : (
              <>
                <DashboardCards orders={orders} />
                <RecentOrders orders={orders} />
                <FinancialOverview />
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
