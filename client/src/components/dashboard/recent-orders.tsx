import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface RecentOrdersProps {
  orders: any[];
}

export default function RecentOrders({ orders = [] }: RecentOrdersProps) {
  // Get orders sorted by date, most recent first
  const recentOrders = [...(orders || [])]
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    .slice(0, 5);
  
  // Fetch contacts to get client names
  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
  });

  // Function to get client name from contacts
  const getClientName = (clientId: string) => {
    const contact = contacts?.find(c => c.id === clientId);
    return contact?.name || 'Cliente';
  };

  // Function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'NEW': return "bg-blue-100 text-blue-800";
      case 'DELIVERING': return "bg-yellow-100 text-yellow-800";
      case 'DELIVERED': return "bg-green-100 text-green-800";
      case 'COMPLETED': return "bg-primary-100 text-primary-800";
      case 'CANCELED': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Function to get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW': return "Novo";
      case 'DELIVERING': return "Entregando";
      case 'DELIVERED': return "Entregue";
      case 'COMPLETED': return "Concluído";
      case 'CANCELED': return "Cancelado";
      default: return status;
    }
  };

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 bg-primary-100 text-primary-600">
                          <AvatarFallback>
                            {getClientName(order.clientId).substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground-dark">
                            {getClientName(order.clientId)}
                          </div>
                          <div className="text-sm text-foreground-light">
                            {/* Phone would be fetched in a real app */}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground-dark">{formatDate(order.orderDate)}</div>
                      <div className="text-sm text-foreground-light">{formatTime(order.orderDate)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground-dark">{formatCurrency(order.totalValue)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" /> Ver
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-1" /> Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhum pedido encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex justify-between w-full">
            <div className="text-sm text-foreground">
              Mostrando {recentOrders.length} de {orders?.length || 0} pedidos
            </div>
            <div>
              <Button variant="outline" asChild>
                <a href="/orders">Ver todos os pedidos</a>
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
