import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, FileDown, Printer } from "lucide-react";
import ContactCard from "./contact-card";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContactListProps {
  contacts: any[];
  isLoading: boolean;
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  showDeleted: boolean;
  onShowDeletedChange: (show: boolean) => void;
  onEdit: (contact: any) => void;
  onRefresh: () => void;
}

export default function ContactList({
  contacts,
  isLoading,
  selectedType,
  onTypeChange,
  searchQuery,
  onSearchQueryChange,
  showDeleted,
  onShowDeletedChange,
  onEdit,
  onRefresh
}: ContactListProps) {
  const [contactToDelete, setContactToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const contactTypes = [
    { id: null, label: "Todos" },
    { id: "CLIENT", label: "Clientes" },
    { id: "SUPPLIER", label: "Fornecedores" },
    { id: "EMPLOYEE", label: "Colaboradores" },
    { id: "CARRIER", label: "Transportadores" },
    { id: "CONTACT", label: "Gerais" }
  ];

  const handleDeleteClick = (contact: any) => {
    setContactToDelete(contact);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;
    
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/contacts/${contactToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contato excluído",
        description: "O contato foi movido para a lixeira",
      });
      onRefresh();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o contato",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setContactToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setContactToDelete(null);
  };

  // Filter contacts based on search
  const filteredContacts = contacts?.filter(contact => {
    if (!contact) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      (contact.document && contact.document.toLowerCase().includes(searchLower)) ||
      (contact.email && contact.email.toLowerCase().includes(searchLower))
    );
  }) || [];

  return (
    <div>
      {/* Filters */}
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center">
          <div className="sm:hidden">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={selectedType || ""}
              onChange={(e) => onTypeChange(e.target.value || null)}
            >
              {contactTypes.map((type) => (
                <option key={type.id || "all"} value={type.id || ""}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <Tabs value={selectedType || ""} onValueChange={(value) => onTypeChange(value || null)}>
              <TabsList>
                {contactTypes.map((type) => (
                  <TabsTrigger key={type.id || "all"} value={type.id || ""}>
                    {type.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Buscar contatos"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
              />
            </div>
            
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
      </div>
      
      {/* Contact List */}
      {isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
              <div className="px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20 mt-1" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 sm:px-6">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="px-4 py-4 sm:px-6 bg-gray-50">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredContacts.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <ContactCard 
              key={contact.id} 
              contact={contact} 
              onEdit={() => onEdit(contact)}
              onDelete={() => handleDeleteClick(contact)}
              isDeleted={showDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">Nenhum contato encontrado</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery 
              ? `Não encontramos resultados para "${searchQuery}"`
              : showDeleted 
                ? "Não há contatos na lixeira"
                : "Comece adicionando um novo contato"
            }
          </p>
        </div>
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!contactToDelete}
        title="Confirmar exclusão"
        description={`Tem certeza que deseja excluir o contato "${contactToDelete?.name}"? Esta ação pode ser desfeita depois.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
