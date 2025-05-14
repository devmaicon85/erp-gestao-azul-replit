import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Edit, Power } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/confirm-dialog";

const paymentMethodSchema = z.object({
  name: z.string().min(3, "Nome é obrigatório"),
  type: z.enum([
    "CASH",
    "CREDIT_CARD", 
    "DEBIT_CARD", 
    "PIX", 
    "TRANSFER", 
    "CHECK", 
    "RECEIVABLE", 
    "OTHER"
  ]),
  dueDays: z.number().min(0, "Dias devem ser maior ou igual a zero"),
  active: z.boolean().default(true),
});

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

export default function PaymentMethods() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [methodToToggle, setMethodToToggle] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const { toast } = useToast();

  // Fetch payment methods
  const { 
    data: paymentMethods, 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["/api/payment-methods"],
    // Mock data since we don't have the API endpoint yet
    initialData: [
      { 
        id: "1", 
        name: "Dinheiro", 
        type: "CASH", 
        dueDays: 0, 
        active: true 
      },
      { 
        id: "2", 
        name: "Cartão de Crédito", 
        type: "CREDIT_CARD", 
        dueDays: 0, 
        active: true 
      },
      { 
        id: "3", 
        name: "Cartão de Débito", 
        type: "DEBIT_CARD", 
        dueDays: 0, 
        active: true 
      },
      { 
        id: "4", 
        name: "PIX", 
        type: "PIX", 
        dueDays: 0, 
        active: true 
      },
      { 
        id: "5", 
        name: "A Receber (30 dias)", 
        type: "RECEIVABLE", 
        dueDays: 30, 
        active: true 
      },
    ]
  });

  const form = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      name: "",
      type: "CASH",
      dueDays: 0,
      active: true,
    }
  });

  // Watch payment type to show/hide due days field
  const paymentType = form.watch("type");

  const handleAddMethod = () => {
    setEditingMethod(null);
    form.reset({
      name: "",
      type: "CASH",
      dueDays: 0,
      active: true,
    });
    setIsFormOpen(true);
  };

  const handleEditMethod = (method: any) => {
    setEditingMethod(method);
    form.reset({
      name: method.name,
      type: method.type,
      dueDays: method.dueDays,
      active: method.active,
    });
    setIsFormOpen(true);
  };

  const handleToggleActive = (method: any) => {
    setMethodToToggle(method);
  };

  const confirmToggleActive = async () => {
    if (!methodToToggle) return;
    
    setIsToggling(true);
    try {
      // In a real implementation, we would call an API endpoint
      // await apiRequest("PUT", `/api/payment-methods/${methodToToggle.id}`, {
      //   active: !methodToToggle.active
      // });
      
      // For now, we'll simulate success
      setTimeout(() => {
        // Update local data
        const updatedMethods = paymentMethods.map((m: any) => 
          m.id === methodToToggle.id ? { ...m, active: !m.active } : m
        );
        queryClient.setQueryData(["/api/payment-methods"], updatedMethods);
        
        toast({
          title: methodToToggle.active ? "Método desativado" : "Método ativado",
          description: `${methodToToggle.name} foi ${methodToToggle.active ? "desativado" : "ativado"} com sucesso`,
        });
        
        setMethodToToggle(null);
        setIsToggling(false);
      }, 500);
    } catch (error) {
      console.error("Error toggling payment method:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do método de pagamento",
        variant: "destructive",
      });
      setIsToggling(false);
      setMethodToToggle(null);
    }
  };

  const onSubmit = async (data: PaymentMethodFormData) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, we would call an API endpoint
      // if (editingMethod) {
      //   await apiRequest("PUT", `/api/payment-methods/${editingMethod.id}`, data);
      // } else {
      //   await apiRequest("POST", "/api/payment-methods", data);
      // }
      
      // For now, we'll simulate success
      setTimeout(() => {
        // Update local data
        if (editingMethod) {
          const updatedMethods = paymentMethods.map((m: any) => 
            m.id === editingMethod.id ? { ...m, ...data } : m
          );
          queryClient.setQueryData(["/api/payment-methods"], updatedMethods);
        } else {
          const newMethod = {
            id: String(paymentMethods.length + 1),
            ...data
          };
          queryClient.setQueryData(["/api/payment-methods"], [...paymentMethods, newMethod]);
        }
        
        toast({
          title: editingMethod ? "Método atualizado" : "Método adicionado",
          description: `${data.name} foi ${editingMethod ? "atualizado" : "adicionado"} com sucesso`,
        });
        
        setIsFormOpen(false);
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o método de pagamento",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Function to get payment type label
  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'CASH': return "Dinheiro";
      case 'CREDIT_CARD': return "Cartão de Crédito";
      case 'DEBIT_CARD': return "Cartão de Débito";
      case 'PIX': return "PIX";
      case 'TRANSFER': return "Transferência";
      case 'CHECK': return "Cheque";
      case 'RECEIVABLE': return "A Receber";
      case 'OTHER': return "Outro";
      default: return type;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Formas de Pagamento</CardTitle>
            <CardDescription>
              Gerencie as formas de pagamento disponíveis para os pedidos
            </CardDescription>
          </div>
          <Button onClick={handleAddMethod}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Forma
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : paymentMethods?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prazo (dias)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethods.map((method: any) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell>{getPaymentTypeLabel(method.type)}</TableCell>
                    <TableCell>
                      {method.type === "RECEIVABLE" ? method.dueDays : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={method.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {method.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => handleEditMethod(method)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className={method.active ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                        onClick={() => handleToggleActive(method)}
                      >
                        <Power className="h-4 w-4 mr-1" />
                        {method.active ? "Desativar" : "Ativar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-6">
              <p className="text-muted-foreground">Nenhuma forma de pagamento cadastrada</p>
              <Button 
                variant="link" 
                onClick={handleAddMethod}
                className="mt-2"
              >
                Adicionar nova forma de pagamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes da forma de pagamento abaixo
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Cartão de Crédito" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASH">Dinheiro</SelectItem>
                        <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                        <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="TRANSFER">Transferência</SelectItem>
                        <SelectItem value="CHECK">Cheque</SelectItem>
                        <SelectItem value="RECEIVABLE">A Receber</SelectItem>
                        <SelectItem value="OTHER">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Days (only for RECEIVABLE type) */}
              {paymentType === "RECEIVABLE" && (
                <FormField
                  control={form.control}
                  name="dueDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo (dias)*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 30" 
                          min={0}
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Número de dias para vencimento das contas a receber
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Active */}
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativo</FormLabel>
                      <FormDescription>
                        Desativar tornará esta forma de pagamento indisponível para novos pedidos
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingMethod ? "Atualizar" : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirm Toggle Active Dialog */}
      <ConfirmDialog
        isOpen={!!methodToToggle}
        title={`${methodToToggle?.active ? "Desativar" : "Ativar"} forma de pagamento`}
        description={`Tem certeza que deseja ${methodToToggle?.active ? "desativar" : "ativar"} a forma de pagamento "${methodToToggle?.name}"?`}
        confirmText={methodToToggle?.active ? "Desativar" : "Ativar"}
        cancelText="Cancelar"
        isLoading={isToggling}
        onConfirm={confirmToggleActive}
        onCancel={() => setMethodToToggle(null)}
      />
    </>
  );
}
