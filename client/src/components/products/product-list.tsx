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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface ProductListProps {
  products: any[];
  isLoading: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  showDeleted: boolean;
  onShowDeletedChange: (show: boolean) => void;
  onEdit: (product: any) => void;
  onRefresh: () => void;
}

export default function ProductList({
  products,
  isLoading,
  searchQuery,
  onSearchQueryChange,
  showDeleted,
  onShowDeletedChange,
  onEdit,
  onRefresh
}: ProductListProps) {
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/products/${productToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produto excluído",
        description: "O produto foi movido para a lixeira",
      });
      onRefresh();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o produto",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setProductToDelete(null);
  };

  const handleRestore = async (product: any) => {
    try {
      await apiRequest("PUT", `/api/products/${product.id}`, { status: 1 });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produto restaurado",
        description: "O produto foi restaurado com sucesso",
      });
      onRefresh();
    } catch (error) {
      console.error("Error restoring product:", error);
      toast({
        title: "Erro ao restaurar",
        description: "Não foi possível restaurar o produto",
        variant: "destructive",
      });
    }
  };

  // Filter products based on search
  const filteredProducts = products?.filter(product => {
    if (!product) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.internalCode.toLowerCase().includes(searchLower) ||
      (product.barCode && product.barCode.toLowerCase().includes(searchLower))
    );
  }) || [];

  // Product type label
  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case 'SIMPLE': return { label: 'Simples', color: 'bg-blue-100 text-blue-800' };
      case 'CONTAINER': return { label: 'Vasilhame', color: 'bg-amber-100 text-amber-800' };
      case 'WITH_CONTAINER_RETURN': return { label: 'Com retorno', color: 'bg-green-100 text-green-800' };
      default: return { label: type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Buscar por código, código de barras ou nome"
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
          
          <Button
            variant={showDeleted ? "default" : "outline"}
            onClick={() => onShowDeletedChange(!showDeleted)}
          >
            {showDeleted ? "Ativos" : "Excluídos"}
          </Button>
        </div>
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
      ) : filteredProducts.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Código de Barras</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const productType = getProductTypeLabel(product.type);
                  const stockStatus = 
                    product.currentStock <= 0 ? 'bg-red-100 text-red-800' :
                    product.currentStock < product.minimumStock ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800';
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.internalCode}</TableCell>
                      <TableCell>{product.barCode || '-'}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={productType.color}>
                          {productType.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(product.costValue)}</TableCell>
                      <TableCell>{formatCurrency(product.defaultPrice || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={stockStatus}>
                          {product.currentStock} un
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {showDeleted ? (
                          <Button variant="ghost" size="sm" onClick={() => handleRestore(product)}>
                            Restaurar
                          </Button>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                              Editar
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteClick(product)}
                            >
                              Excluir
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">Nenhum produto encontrado</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery 
              ? `Não encontramos resultados para "${searchQuery}"`
              : showDeleted 
                ? "Não há produtos na lixeira"
                : "Comece adicionando um novo produto"
            }
          </p>
        </div>
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        title="Confirmar exclusão"
        description={`Tem certeza que deseja excluir o produto "${productToDelete?.name}"? Esta ação pode ser desfeita depois.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
