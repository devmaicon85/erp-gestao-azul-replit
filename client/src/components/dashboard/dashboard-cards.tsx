import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardCardsProps {
  orders: any[];
}

export default function DashboardCards({ orders = [] }: DashboardCardsProps) {
  // Calculate statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayOrders = orders?.filter(order => {
    const orderDate = new Date(order.orderDate);
    return orderDate >= today;
  }) || [];
  
  const totalValue = todayOrders.reduce((sum, order) => sum + parseFloat(order.totalValue.toString()), 0);
  
  const pendingOrders = orders?.filter(order => 
    order.status === 'NEW' || order.status === 'DELIVERING'
  ) || [];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* Orders Today Card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
              <ShoppingCart className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-foreground-light truncate">Pedidos Hoje</dt>
                <dd>
                  <div className="text-lg font-medium text-foreground-dark">{todayOrders.length}</div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <a href="/orders" className="font-medium text-primary-600 hover:text-primary-700">Ver todos</a>
          </div>
        </CardFooter>
      </Card>
      
      {/* Revenue Card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-foreground-light truncate">Faturamento</dt>
                <dd>
                  <div className="text-lg font-medium text-foreground-dark">{formatCurrency(totalValue)}</div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <a href="/finance" className="font-medium text-primary-600 hover:text-primary-700">Ver relatório</a>
          </div>
        </CardFooter>
      </Card>
      
      {/* Pending Orders Card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-foreground-light truncate">Pendentes</dt>
                <dd>
                  <div className="text-lg font-medium text-foreground-dark">{pendingOrders.length}</div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <a href="/orders" className="font-medium text-primary-600 hover:text-primary-700">Ver pendências</a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
