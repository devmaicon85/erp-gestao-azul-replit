import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/app-shell";
import ProductList from "@/components/products/product-list";
import ProductForm from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { toast } = useToast();
  
  // Fetch products
  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["/api/products", { status: showDeleted ? 0 : 1 }],
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    refetch();
    toast({
      title: "Sucesso",
      description: "Produto salvo com sucesso",
    });
  };

  return (
    <AppShell currentModule="products">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-foreground">Produtos</h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button onClick={handleAddProduct}>
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Novo Produto
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <ProductList 
              products={products}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              showDeleted={showDeleted}
              onShowDeletedChange={setShowDeleted}
              onEdit={handleEditProduct}
              onRefresh={refetch}
            />

            {showForm && (
              <ProductForm
                product={editingProduct}
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
