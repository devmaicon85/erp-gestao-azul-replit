import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, FileDown, Printer } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface OrderListProps {
  orders: any[];
  isLoading: boolean;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onEdit: (order: any) => void;
  onRefresh: () => void;
}

export default function OrderList({
  orders,
  isLoading,
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchQueryChange,
  onEdit,
  onRefresh
}: OrderListProps) {
  const [orderToCancel, setOrderToCancel] = useState<any>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const { toast } = useToast();

  // Fetch contacts to get client names
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const statusOptions = [
    { id: null, label: "Todos" },
    { id: "NEW", label: "Novos" },
    { id: "DELIVERING", label: "Entregando" },
    { id: "DELIVERED", label: "Entregue" },
    { id: "COMPLETED", label: "Concluídos" },
    { id: "CANCELED", label: "Cancelados" }
  ];

  const handleCancelClick = (order: any) => {
    setOrderToCancel(order);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    
    setIsCanceling(true);
    try {
      await apiRequest("PUT", `/api/orders/${orderToCancel.id}`, { status: 'CANCELED' });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Pedido cancelado",
        description: "O pedido foi cancelado com sucesso",
      });
      onRefresh();
    } catch (error) {
      console.error("Error canceling order:", error);
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar o pedido",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
      setOrderToCancel(null);
    }
  };

  const handleCancelCancel = () => {
    setOrderToCancel(null);
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await apiRequest("PUT", `/api/orders/${orderId}`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status atualizado",
        description: `Pedido atualizado para ${getStatusLabel(status)}`,
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

  // Filter orders based on search
  const filteredOrders = orders?.filter(order => {
    if (!order) return false;
    
    const searchLower = searchQuery.toLowerCase();
    const clientName = getClientName(order.clientId).toLowerCase();
    
    return (
      clientName.includes(searchLower) ||
      (order.id && order.id.toLowerCase().includes(searchLower)) ||
      (order.address && order.address.toLowerCase().includes(searchLower))
    );
  }) || [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Buscar pedidos por cliente, endereço..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            <span>Filtros</span>
          </Button>
          
          <Button variant="outline" size="icon">
            <FileDown className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Status Tabs */}
      <div className="mb-6">
        <Tabs value={selectedStatus || ""} onValueChange={(value) => onStatusChange(value || null)}>
          <TabsList>
            {statusOptions.map((status) => (
              <TabsTrigger key={status.id || "all"} value={status.id || ""}>
                {status.label}
                {(status.id === null || status.id === selectedStatus) && (
                  <Badge 
                    variant="outline" 
                    className="ml-2 bg-primary-100 text-primary-600 border-primary-200"
                  >
                    {status.id === null
                      ? orders?.length || 0
                      : orders?.filter(o => o.status === status.id).length || 0}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {isLoading ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4">
            <Skeleton className="h-8 w-32 mb-6" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getClientName(order.clientId)}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {order.address || "Endereço não especificado"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(order.orderDate)}</TableCell>
                    <TableCell>{order.itemCount || "?"}</TableCell>
                    <TableCell>{formatCurrency(order.deliveryFee)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.totalValue)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        {order.paymentMethod || "Dinheiro"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(order)}>
                          Editar
                        </Button>
                        
                        {order.status === 'NEW' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'DELIVERING')}
                          >
                            Entregar
                          </Button>
                        )}
                        
                        {order.status === 'DELIVERING' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                          >
                            Confirmar
                          </Button>
                        )}
                        
                        {(order.status === 'NEW' || order.status === 'DELIVERING') && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleCancelClick(order)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">Nenhum pedido encontrado</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery 
              ? `Não encontramos resultados para "${searchQuery}"`
              : selectedStatus
                ? `Não há pedidos com status "${getStatusLabel(selectedStatus)}"`
                : "Não existem pedidos cadastrados"
            }
          </p>
        </div>
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!orderToCancel}
        title="Confirmar cancelamento"
        description={`Tem certeza que deseja cancelar o pedido para "${getClientName(orderToCancel?.clientId || '')}"? Esta ação não poderá ser desfeita.`}
        confirmText="Cancelar Pedido"
        cancelText="Voltar"
        isLoading={isCanceling}
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelCancel}
      />
    </div>
  );
}
