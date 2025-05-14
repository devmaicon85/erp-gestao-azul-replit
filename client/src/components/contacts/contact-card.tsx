import { useState } from "react";
import { Mail, Phone, MapPin, MoreHorizontal, Trash2, PenSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPhoneNumber } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContactCardProps {
  contact: any;
  onEdit: () => void;
  onDelete: () => void;
  isDeleted?: boolean;
}

export default function ContactCard({ contact, onEdit, onDelete, isDeleted = false }: ContactCardProps) {
  const { toast } = useToast();
  const [isRestoring, setIsRestoring] = useState(false);

  if (!contact) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CLIENT': return { label: 'Cliente', bgColor: 'bg-blue-100 text-blue-800' };
      case 'SUPPLIER': return { label: 'Fornecedor', bgColor: 'bg-green-100 text-green-800' };
      case 'EMPLOYEE': return { label: 'Colaborador', bgColor: 'bg-purple-100 text-purple-800' };
      case 'CARRIER': return { label: 'Transportador', bgColor: 'bg-orange-100 text-orange-800' };
      case 'CONTACT': return { label: 'Contato Geral', bgColor: 'bg-gray-100 text-gray-800' };
      default: return { label: type, bgColor: 'bg-gray-100 text-gray-800' };
    }
  };

  const initials = contact.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const contactType = getTypeLabel(contact.type);

  const handleRestore = async () => {
    if (isRestoring) return;
    
    setIsRestoring(true);
    try {
      // Call API to restore the contact (set status back to 1)
      await apiRequest("PUT", `/api/contacts/${contact.id}`, { status: 1 });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contato restaurado",
        description: "O contato foi restaurado com sucesso",
      });
    } catch (error) {
      console.error("Error restoring contact:", error);
      toast({
        title: "Erro ao restaurar",
        description: "Não foi possível restaurar o contato",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 bg-primary-100 text-primary-600">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="ml-4">
              <h3 className="text-lg font-medium leading-6 text-foreground-dark">{contact.name}</h3>
              <p className="text-sm text-foreground-light">
                <Badge variant="outline" className={contactType.bgColor}>
                  {contactType.label}
                </Badge>
                {contact.isDeliveryPerson && (
                  <Badge variant="outline" className="ml-2 bg-indigo-100 text-indigo-800">
                    Entregador
                  </Badge>
                )}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isDeleted ? (
                  <DropdownMenuItem onClick={handleRestore}>
                    Restaurar
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={onEdit}>
                      <PenSquare className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="px-4 py-4 sm:px-6">
        {contact.email && (
          <div className="flex items-center text-sm text-foreground-light mb-2">
            <Mail className="mr-2 h-4 w-4 text-foreground" />
            <a href={`mailto:${contact.email}`} className="hover:text-primary-600">
              {contact.email}
            </a>
          </div>
        )}
        {/* Assuming phones data would be fetched in a real implementation */}
        <div className="flex items-center text-sm text-foreground-light mb-2">
          <Phone className="mr-2 h-4 w-4 text-foreground" />
          <span>{contact.phone ? formatPhoneNumber(contact.phone) : "Nenhum telefone cadastrado"}</span>
        </div>
        {/* Assuming addresses data would be fetched in a real implementation */}
        <div className="flex items-center text-sm text-foreground-light">
          <MapPin className="mr-2 h-4 w-4 text-foreground" />
          <a 
            href={`https://maps.google.com/?q=${encodeURIComponent(contact.address || '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary-600"
          >
            {contact.address || "Nenhum endereço cadastrado"}
          </a>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="flex justify-between text-sm">
          <Button variant="link" className="px-0" onClick={onEdit}>
            Editar
          </Button>
          <Button variant="link" className="px-0 text-gray-600 hover:text-gray-700">
            Ver {contact.type === 'CLIENT' ? 'pedidos' : contact.type === 'SUPPLIER' ? 'compras' : 'detalhes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
