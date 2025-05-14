import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, AlertTriangle, CheckCircle2, LockIcon, UnlockIcon } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schema for opening the cash register
const openRegisterSchema = z.object({
  initialAmount: z.number().min(0, "O valor inicial não pode ser negativo"),
});

// Schema for cash movements
const cashMovementSchema = z.object({
  type: z.enum(["SALE", "RECEIVABLE_PAYMENT", "WITHDRAWAL", "DEPOSIT", "ADJUSTMENT"]),
  description: z.string().min(3, "Descrição é obrigatória"),
  value: z.number().min(0.01, "Valor deve ser maior que zero"),
  paymentMethodId: z.string().optional(),
});

// Schema for closing the cash register
const closeRegisterSchema = z.object({
  finalAmount: z.number().min(0, "O valor final não pode ser negativo"),
});

type OpenRegisterFormData = z.infer<typeof openRegisterSchema>;
type CashMovementFormData = z.infer<typeof cashMovementSchema>;
type CloseRegisterFormData = z.infer<typeof closeRegisterSchema>;

export default function CashRegister() {
  const [isOpenFormOpen, setIsOpenFormOpen] = useState(false);
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false);
  const [isCloseFormOpen, setIsCloseFormOpen] = useState(false);
  const [isWithdrawalFormOpen, setIsWithdrawalFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Forms
  const openForm = useForm<OpenRegisterFormData>({
    resolver: zodResolver(openRegisterSchema),
    defaultValues: {
      initialAmount: 0,
    },
  });

  const movementForm = useForm<CashMovementFormData>({
    resolver: zodResolver(cashMovementSchema),
    defaultValues: {
      type: "SALE",
      description: "",
      value: 0,
      paymentMethodId: "1", // Default to cash
    },
  });

  const withdrawalForm = useForm<CashMovementFormData>({
    resolver: zodResolver(cashMovementSchema),
    defaultValues: {
      type: "WITHDRAWAL",
      description: "Sangria de caixa",
      value: 0,
      paymentMethodId: "1", // Default to cash
    },
  });

  const closeForm = useForm<CloseRegisterFormData>({
    resolver: zodResolver(closeRegisterSchema),
    defaultValues: {
      finalAmount: 0,
    },
  });

  // Fetch current cash register
  const { 
    data: cashRegister, 
    isLoading: registerLoading,
    refetch: refetchRegister
  } = useQuery({
    queryKey: ["/api/cash-registers/current"],
    // Mock data since we don't have the API endpoint yet
    initialData: {
      id: "current",
      status: "CLOSED", // OPEN or CLOSED
      openingDate: null,
      closingDate: null,
      initialAmount: 0,
      finalAmount: 0,
      movements: []
    }
  });

  // Fetch payment methods
  const { data: paymentMethods } = useQuery({
    queryKey: ["/api/payment-methods"],
    enabled: isMovementFormOpen || isWithdrawalFormOpen,
    // Mock data
    initialData: [
      { id: "1", name: "Dinheiro", type: "CASH" },
      { id: "2", name: "Cartão de Crédito", type: "CREDIT_CARD" },
      { id: "3", name: "Cartão de Débito", type: "DEBIT_CARD" },
      { id: "4", name: "PIX", type: "PIX" },
    ]
  });

  // Calculate totals
  const totalInRegister = cashRegister?.initialAmount + 
    (cashRegister?.movements?.reduce((sum: number, m: any) => {
      // Add income, subtract withdrawals
      if (m.type === "SALE" || m.type === "RECEIVABLE_PAYMENT" || m.type === "DEPOSIT" || 
         (m.type === "ADJUSTMENT" && m.value > 0)) {
        return sum + m.value;
      } else if (m.type === "WITHDRAWAL" || (m.type === "ADJUSTMENT" && m.value < 0)) {
        return sum - Math.abs(m.value);
      }
      return sum;
    }, 0) || 0);

  // Handle opening cash register
  const handleOpenRegister = async (data: OpenRegisterFormData) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, we would call an API endpoint
      // await apiRequest("POST", "/api/cash-registers", {
      //   initialAmount: data.initialAmount,
      // });
      
      // For now, we'll simulate success
      setTimeout(() => {
        // Update local data
        queryClient.setQueryData(["/api/cash-registers/current"], {
          id: "current",
          status: "OPEN",
          openingDate: new Date().toISOString(),
          closingDate: null,
          initialAmount: data.initialAmount,
          finalAmount: 0,
          movements: []
        });
        
        toast({
          title: "Caixa aberto",
          description: `Caixa aberto com valor inicial de ${formatCurrency(data.initialAmount)}`,
        });
        
        setIsOpenFormOpen(false);
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      console.error("Error opening cash register:", error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o caixa",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Handle adding movement
  const handleAddMovement = async (data: CashMovementFormData) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, we would call an API endpoint
      // await apiRequest("POST", "/api/cash-movements", data);
      
      // For now, we'll simulate success
      setTimeout(() => {
        // Update local data
        const newMovement = {
          id: String(Date.now()),
          ...data,
          movementDate: new Date().toISOString(),
          paymentMethodName: paymentMethods?.find((m: any) => m.id === data.paymentMethodId)?.name || "Dinheiro"
        };
        
        const updatedRegister = {
          ...cashRegister,
          movements: [...(cashRegister?.movements || []), newMovement]
        };
        
        queryClient.setQueryData(["/api/cash-registers/current"], updatedRegister);
        
        toast({
          title: "Movimento registrado",
          description: `${data.type === "WITHDRAWAL" ? "Sangria" : "Movimento"} de ${formatCurrency(data.value)} registrado com sucesso`,
        });
        
        setIsMovementFormOpen(false);
        setIsWithdrawalFormOpen(false);
        setIsSubmitting(false);
        
        // Reset forms
        movementForm.reset({
          type: "SALE",
          description: "",
          value: 0,
          paymentMethodId: "1",
        });
        
        withdrawalForm.reset({
          type: "WITHDRAWAL",
          description: "Sangria de caixa",
          value: 0,
          paymentMethodId: "1",
        });
      }, 500);
    } catch (error) {
      console.error("Error registering movement:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o movimento",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Handle closing cash register
  const handleCloseRegister = async (data: CloseRegisterFormData) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, we would call an API endpoint
      // await apiRequest("PUT", `/api/cash-registers/${cashRegister.id}/close`, {
      //   finalAmount: data.finalAmount
      // });
      
      // For now, we'll simulate success
      setTimeout(() => {
        // Update local data
        const updatedRegister = {
          ...cashRegister,
          status: "CLOSED",
          closingDate: new Date().toISOString(),
          finalAmount: data.finalAmount
        };
        
        queryClient.setQueryData(["/api/cash-registers/current"], updatedRegister);
        
        toast({
          title: "Caixa fechado",
          description: `Caixa fechado com valor final de ${formatCurrency(data.finalAmount)}`,
        });
        
        setIsCloseFormOpen(false);
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      console.error("Error closing cash register:", error);
      toast({
        title: "Erro",
        description: "Não foi possível fechar o caixa",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleOpenFormOpen = () => {
    openForm.reset({ initialAmount: 0 });
    setIsOpenFormOpen(true);
  };

  const handleMovementFormOpen = () => {
    movementForm.reset({
      type: "SALE",
      description: "",
      value: 0,
      paymentMethodId: "1",
    });
    setIsMovementFormOpen(true);
  };

  const handleWithdrawalFormOpen = () => {
    withdrawalForm.reset({
      type: "WITHDRAWAL",
      description: "Sangria de caixa",
      value: 0,
      paymentMethodId: "1",
    });
    setIsWithdrawalFormOpen(true);
  };

  const handleCloseFormOpen = () => {
    closeForm.reset({ finalAmount: totalInRegister });
    setIsCloseFormOpen(true);
  };

  // Function to get movement type label
  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'SALE': return "Venda";
      case 'RECEIVABLE_PAYMENT': return "Recebimento";
      case 'WITHDRAWAL': return "Sangria";
      case 'DEPOSIT': return "Depósito";
      case 'ADJUSTMENT': return "Ajuste";
      default: return type;
    }
  };

  // Function to determine if movement is income or expense
  const isIncomeMovement = (type: string) => {
    return type === 'SALE' || type === 'RECEIVABLE_PAYMENT' || type === 'DEPOSIT' || 
           (type === 'ADJUSTMENT' && Number(type) > 0);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Controle de Caixa</CardTitle>
            <CardDescription>
              Gerencie as movimentações e o status do caixa
            </CardDescription>
          </div>
          {cashRegister?.status === "OPEN" ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleMovementFormOpen}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Movimento
              </Button>
              <Button 
                variant="outline" 
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={handleWithdrawalFormOpen}
              >
                Sangria
              </Button>
              <Button 
                variant="destructive"
                onClick={handleCloseFormOpen}
              >
                <LockIcon className="mr-2 h-4 w-4" />
                Fechar Caixa
              </Button>
            </div>
          ) : (
            <Button onClick={handleOpenFormOpen}>
              <UnlockIcon className="mr-2 h-4 w-4" />
              Abrir Caixa
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {registerLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : cashRegister?.status === "OPEN" ? (
            <>
              {/* Cash Register Status */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center">
                        <Badge 
                          variant="outline" 
                          className="bg-green-100 text-green-800 mr-2"
                        >
                          Aberto
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Desde: {formatDateTime(cashRegister.openingDate)}
                        </p>
                      </div>
                      <h3 className="text-lg font-medium mt-1">
                        Valor inicial: {formatCurrency(cashRegister.initialAmount)}
                      </h3>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo atual</p>
                      <p className="text-2xl font-bold text-primary-600">{formatCurrency(totalInRegister)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Movements Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Movimentações</CardTitle>
                </CardHeader>
                <CardContent>
                  {cashRegister.movements?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Forma Pagamento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashRegister.movements.map((movement: any) => (
                          <TableRow key={movement.id}>
                            <TableCell>{formatDateTime(movement.movementDate)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={movement.type === "WITHDRAWAL" 
                                  ? "bg-red-100 text-red-800" 
                                  : "bg-green-100 text-green-800"}
                              >
                                {getMovementTypeLabel(movement.type)}
                              </Badge>
                            </TableCell>
                            <TableCell>{movement.description}</TableCell>
                            <TableCell>{movement.paymentMethodName || "-"}</TableCell>
                            <TableCell className="text-right">
                              <span className={movement.type === "WITHDRAWAL" ? "text-red-600" : "text-green-600"}>
                                {movement.type === "WITHDRAWAL" ? "-" : "+"}{formatCurrency(movement.value)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-6">
                      <p className="text-muted-foreground">Nenhuma movimentação registrada</p>
                      <Button 
                        variant="link" 
                        onClick={handleMovementFormOpen}
                        className="mt-2"
                      >
                        Registrar primeiro movimento
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center p-12">
              <Alert variant="default" className="max-w-md mx-auto">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Caixa Fechado</AlertTitle>
                <AlertDescription>
                  O caixa está fechado no momento. Clique em "Abrir Caixa" para iniciar as operações.
                </AlertDescription>
              </Alert>

              {cashRegister.closingDate && (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground">
                    Último fechamento: {formatDateTime(cashRegister.closingDate)}<br />
                    Valor final: {formatCurrency(cashRegister.finalAmount)}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Cash Register Form */}
      <Dialog open={isOpenFormOpen} onOpenChange={setIsOpenFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
            <DialogDescription>
              Informe o valor inicial disponível no caixa
            </DialogDescription>
          </DialogHeader>

          <Form {...openForm}>
            <form onSubmit={openForm.handleSubmit(handleOpenRegister)} className="space-y-6">
              <FormField
                control={openForm.control}
                name="initialAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Inicial</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor em dinheiro disponível para início das operações
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpenFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Abrir Caixa
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Movement Form */}
      <Dialog open={isMovementFormOpen} onOpenChange={setIsMovementFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Movimento</DialogTitle>
            <DialogDescription>
              Informe os detalhes do movimento de caixa
            </DialogDescription>
          </DialogHeader>

          <Form {...movementForm}>
            <form onSubmit={movementForm.handleSubmit(handleAddMovement)} className="space-y-6">
              <FormField
                control={movementForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimento</FormLabel>
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
                        <SelectItem value="SALE">Venda</SelectItem>
                        <SelectItem value="RECEIVABLE_PAYMENT">Recebimento</SelectItem>
                        <SelectItem value="DEPOSIT">Depósito</SelectItem>
                        <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={movementForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição do movimento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={movementForm.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={movementForm.control}
                name="paymentMethodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods?.map((method: any) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsMovementFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Form */}
      <Dialog open={isWithdrawalFormOpen} onOpenChange={setIsWithdrawalFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Sangria</DialogTitle>
            <DialogDescription>
              Informe os detalhes da sangria de caixa
            </DialogDescription>
          </DialogHeader>

          <Form {...withdrawalForm}>
            <form onSubmit={withdrawalForm.handleSubmit(handleAddMovement)} className="space-y-6">
              <FormField
                control={withdrawalForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Motivo da sangria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={withdrawalForm.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        max={totalInRegister}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor máximo disponível: {formatCurrency(totalInRegister)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsWithdrawalFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || withdrawalForm.getValues("value") > totalInRegister}
                  variant="destructive"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Sangria
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Close Cash Register Form */}
      <Dialog open={isCloseFormOpen} onOpenChange={setIsCloseFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
            <DialogDescription>
              Confirme o valor final do caixa e feche as operações
            </DialogDescription>
          </DialogHeader>

          <Form {...closeForm}>
            <form onSubmit={closeForm.handleSubmit(handleCloseRegister)} className="space-y-6">
              <Alert className="mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Confirme o valor no caixa</AlertTitle>
                <AlertDescription>
                  O sistema calculou um saldo de {formatCurrency(totalInRegister)}. 
                  Contabilize o dinheiro físico e ajuste se necessário.
                </AlertDescription>
              </Alert>

              <FormField
                control={closeForm.control}
                name="finalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Final</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor real disponível no caixa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {closeForm.getValues("finalAmount") !== totalInRegister && closeForm.getValues("finalAmount") !== 0 && (
                <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200 text-sm">
                  <div className="font-medium text-yellow-800">Diferença detectada!</div>
                  <div className="text-yellow-700">
                    {closeForm.getValues("finalAmount") > totalInRegister ? "Sobra" : "Falta"} de {formatCurrency(Math.abs(closeForm.getValues("finalAmount") - totalInRegister))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCloseFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} variant="destructive">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Fechar Caixa
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
