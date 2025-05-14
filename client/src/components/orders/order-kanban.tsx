import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Edit, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Truck,
  ShoppingCart,
  CheckCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderKanbanProps {
  orders: any[];
  isLoading: boolean;
  onEdit: (order: any) => void;
  onRefresh: () => void;
}

export default function OrderKanban({ orders, isLoading, onEdit, onRefresh }: OrderKanbanProps) {
  const { toast } = useToast();
  
  // Fetch contacts to get client names
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/contacts"],
  });

  // Update order status
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await apiRequest("PUT", `/api/orders/${orderId}`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status atualizado",
        description: `Pedido atualizado para ${status === 'DELIVERING' ? 'Entregando' : 
                              status === 'DELIVERED' ? 'Entregue' : 
                              status === 'COMPLETED' ? 'Concluído' : 
                              status === 'CANCELED' ? 'Cancelado' : 'Novo'}`,
      });
      onRefresh();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status do pedido",
        variant: "destructive",
      });
    }
  };

  // Function to get client name from contacts
  const getClientName = (clientId: string) => {
    if (contactsLoading) return "Carregando...";
    const contact = contacts?.find((c: any) => c.id === clientId);
    return contact?.name || 'Cliente';
  };

  // Get orders by status
  const newOrders = orders?.filter((order) => order.status === 'NEW') || [];
  const deliveringOrders = orders?.filter((order) => order.status === 'DELIVERING') || [];
  const deliveredOrders = orders?.filter((order) => order.status === 'DELIVERED') || [];
  const canceledOrders = orders?.filter((order) => order.status === 'CANCELED') || [];

  // Loading skeletons for columns
  const columnSkeleton = (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="shadow-sm">
          <CardContent className="p-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex justify-between mt-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {/* New Orders Column */}
        <Card>
          <CardHeader className="p-4 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium flex items-center text-foreground-dark">
                <div className="h-6 w-6 rounded-full bg-blue-500 mr-2 flex items-center justify-center">
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                Novos pedidos
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-2 py-3 h-[550px] overflow-y-auto">
            {columnSkeleton}
          </CardContent>
        </Card>

        {/* Delivering Orders Column */}
        <Card>
          <CardHeader className="p-4 bg-yellow-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium flex items-center text-foreground-dark">
                <div className="h-6 w-6 rounded-full bg-yellow-500 mr-2 flex items-center justify-center">
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                Entregando
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-2 py-3 h-[550px] overflow-y-auto">
            {columnSkeleton}
          </CardContent>
        </Card>

        {/* Delivered Orders Column */}
        <Card>
          <CardHeader className="p-4 bg-green-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium flex items-center text-foreground-dark">
                <div className="h-6 w-6 rounded-full bg-green-500 mr-2 flex items-center justify-center">
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                Entregue
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-2 py-3 h-[550px] overflow-y-auto">
            {columnSkeleton}
          </CardContent>
        </Card>

        {/* Canceled Orders Column */}
        <Card>
          <CardHeader className="p-4 bg-red-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium flex items-center text-foreground-dark">
                <div className="h-6 w-6 rounded-full bg-red-500 mr-2 flex items-center justify-center">
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                Cancelados
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-2 py-3 h-[550px] overflow-y-auto">
            {columnSkeleton}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {/* New Orders Column */}
      <Card>
        <CardHeader className="p-4 bg-blue-50 border-b border-gray-200">
          <CardTitle className="text-lg font-medium flex items-center text-foreground-dark">
            <div className="h-6 w-6 rounded-full bg-blue-500 mr-2 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{newOrders.length}</span>
            </div>
            Novos pedidos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 py-3 h-[550px] overflow-y-auto">
          {newOrders.length > 0 ? (
            <div className="space-y-2">
              {newOrders.map((order) => (
                <Card key={order.id} className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-foreground-dark">
                        {getClientName(order.clientId)}
                      </div>
                      <div className="text-xs text-foreground-light">
                        {formatDateTime(order.orderDate)}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-foreground">
                      <div className="flex justify-between mb-1">
                        <span>{order.itemCount || '?'} itens | Taxa: {formatCurrency(order.deliveryFee)}</span>
                        <span className="font-semibold">{formatCurrency(order.totalValue)}</span>
                      </div>
                      <div className="flex items-center text-foreground-light">
                        <span className="truncate">{order.address || "Endereço não encontrado"}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {order.paymentMethod || "Dinheiro"}
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(order)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                          onClick={() => updateOrderStatus(order.id, 'DELIVERING')}
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => updateOrderStatus(order.id, 'CANCELED')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <ShoppingCart className="h-12 w-12 text-blue-200 mb-2" />
              <p className="text-foreground-light">Nenhum novo pedido</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delivering Orders Column */}
      <Card>
        <CardHeader className="p-4 bg-yellow-50 border-b border-gray-200">
          <CardTitle className="text-lg font-medium flex items-center text-foreground-dark">
            <div className="h-6 w-6 rounded-full bg-yellow-500 mr-2 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{deliveringOrders.length}</span>
            </div>
            Entregando
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 py-3 h-[550px] overflow-y-auto">
          {deliveringOrders.length > 0 ? (
            <div className="space-y-2">
              {deliveringOrders.map((order) => (
                <Card key={order.id} className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-foreground-dark">
                        {getClientName(order.clientId)}
                      </div>
                      <div className="text-xs text-foreground-light">
                        {formatDateTime(order.orderDate)}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-foreground">
                      <div className="flex justify-between mb-1">
                        <span>{order.itemCount || '?'} itens | Taxa: {formatCurrency(order.deliveryFee)}</span>
                        <span className="font-semibold">{formatCurrency(order.totalValue)}</span>
                      </div>
                      <div className="flex items-center text-foreground-light">
                        <span className="truncate">{order.address || "Endereço não encontrado"}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Saiu: {order.departureTime || "12:00"}
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(order)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Truck className="h-12 w-12 text-yellow-200 mb-2" />
              <p className="text-foreground-light">Nenhuma entrega em andamento</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delivered Orders Column */}
      <Card>
        <CardHeader className="p-4 bg-green-50 border-b border-gray-200">
          <CardTitle className="text-lg font-medium flex items-center text-foreground-dark">
            <div className="h-6 w-6 rounded-full bg-green-500 mr-2 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{deliveredOrders.length}</span>
            </div>
            Entregue
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 py-3 h-[550px] overflow-y-auto">
          {deliveredOrders.length > 0 ? (
            <div className="space-y-2">
              {deliveredOrders.map((order) => (
                <Card key={order.id} className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-foreground-dark">
                        {getClientName(order.clientId)}
                      </div>
                      <div className="text-xs text-foreground-light">
                        {formatDateTime(order.orderDate)}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-foreground">
                      <div className="flex justify-between mb-1">
                        <span>{order.itemCount || '?'} itens | Taxa: {formatCurrency(order.deliveryFee)}</span>
                        <span className="font-semibold">{formatCurrency(order.totalValue)}</span>
                      </div>
                      <div className="flex items-center text-foreground-light">
                        <span className="truncate">{order.address || "Endereço não encontrado"}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Entregue: {order.deliveryTime || "14:30"}
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                          onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Check className="h-12 w-12 text-green-200 mb-2" />
              <p className="text-foreground-light">Nenhuma entrega concluída</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Canceled Orders Column */}
      <Card>
        <CardHeader className="p-4 bg-red-50 border-b border-gray-200">
          <CardTitle className="text-lg font-medium flex items-center text-foreground-dark">
            <div className="h-6 w-6 rounded-full bg-red-500 mr-2 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{canceledOrders.length}</span>
            </div>
            Cancelados
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 py-3 h-[550px] overflow-y-auto">
          {canceledOrders.length > 0 ? (
            <div className="space-y-2">
              {canceledOrders.map((order) => (
                <Card key={order.id} className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-foreground-dark">
                        {getClientName(order.clientId)}
                      </div>
                      <div className="text-xs text-foreground-light">
                        {formatDateTime(order.orderDate)}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-foreground">
                      <div className="flex justify-between mb-1">
                        <span>{order.itemCount || '?'} itens | Taxa: {formatCurrency(order.deliveryFee)}</span>
                        <span className="font-semibold">{formatCurrency(order.totalValue)}</span>
                      </div>
                      <div className="flex items-center text-foreground-light">
                        <span className="truncate">{order.address || "Endereço não encontrado"}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        {order.cancelReason || "Cliente desistiu"}
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <AlertTriangle className="h-12 w-12 text-red-200 mb-2" />
              <p className="text-foreground-light">Nenhum pedido cancelado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
