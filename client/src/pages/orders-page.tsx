import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/app-shell";
import OrderKanban from "@/components/orders/order-kanban";
import OrderList from "@/components/orders/order-list";
import OrderForm from "@/components/orders/order-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function OrdersPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const { toast } = useToast();
  
  // Fetch orders
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["/api/orders", { status: selectedStatus }],
  });

  const handleAddOrder = () => {
    setEditingOrder(null);
    setShowForm(true);
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingOrder(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingOrder(null);
    refetch();
    toast({
      title: "Sucesso",
      description: "Pedido salvo com sucesso",
    });
  };

  const handleStatusChange = (status: string | null) => {
    setSelectedStatus(status);
  };

  return (
    <AppShell currentModule="orders">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-foreground">Pedidos</h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button onClick={handleAddOrder}>
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Novo Pedido
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "kanban" | "list")} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="kanban">Kanban</TabsTrigger>
                <TabsTrigger value="list">Lista</TabsTrigger>
              </TabsList>
              
              <TabsContent value="kanban">
                <OrderKanban 
                  orders={orders}
                  isLoading={isLoading}
                  onEdit={handleEditOrder}
                  onRefresh={refetch}
                />
              </TabsContent>
              
              <TabsContent value="list">
                <OrderList 
                  orders={orders}
                  isLoading={isLoading}
                  selectedStatus={selectedStatus}
                  onStatusChange={handleStatusChange}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  onEdit={handleEditOrder}
                  onRefresh={refetch}
                />
              </TabsContent>
            </Tabs>

            {showForm && (
              <OrderForm
                order={editingOrder}
                isOpen={showForm}
                onClose={handleFormClose}
                onSuccess={handleFormSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
