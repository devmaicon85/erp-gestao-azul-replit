import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Search, FileDown, Printer, Filter, CreditCard, CalendarIcon, Plus } from "lucide-react";
import { format, addDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const paymentSchema = z.object({
  paymentDate: z.date(),
  value: z.number().min(0.01, "Valor deve ser maior que zero"),
  observation: z.string().optional(),
});

const receivablePaymentFormSchema = z.object({
  receivableId: z.string(),
  payment: paymentSchema,
});

type ReceivablePaymentFormData = z.infer<typeof receivablePaymentFormSchema>;

export default function Receivables() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | undefined;
  }>({
    from: new Date(),
    to: addDays(new Date(), 30),
  });
  const { toast } = useToast();

  // Fetch receivables
  const { 
    data: receivables, 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["/api/receivables", { status: selectedStatus }],
    // Mock data since we don't have the API endpoint yet
    initialData: [
      {
        id: "1",
        dueDate: "2023-07-10T00:00:00.000Z",
        totalValue: 350.00,
        receivedValue: 0,
        status: "OPEN",
        description: "Pedido #1234",
        client: { id: "1", name: "João Silva" },
        payments: []
      },
      {
        id: "2",
        dueDate: "2023-06-28T00:00:00.000Z",
        totalValue: 520.00,
        receivedValue: 0,
        status: "OVERDUE",
        description: "Pedido #1235",
        client: { id: "2", name: "Maria Oliveira" },
        payments: []
      },
      {
        id: "3",
        dueDate: "2023-07-15T00:00:00.000Z",
        totalValue: 750.00,
        receivedValue: 300.00,
        status: "PARTIAL_RECEIVED",
        description: "Pedido #1236",
        client: { id: "3", name: "Carlos Almeida" },
        payments: [
          {
            id: "1",
            paymentDate: "2023-06-30T00:00:00.000Z",
            value: 300.00,
            observation: "Pagamento parcial"
          }
        ]
      },
      {
        id: "4",
        dueDate: "2023-06-20T00:00:00.000Z",
        totalValue: 420.00,
        receivedValue: 420.00,
        status: "RECEIVED",
        description: "Pedido #1237",
        client: { id: "1", name: "João Silva" },
        payments: [
          {
            id: "2",
            paymentDate: "2023-06-18T00:00:00.000Z",
            value: 420.00,
            observation: "Pagamento total"
          }
        ]
      },
    ]
  });

  // Payments form
  const form = useForm<ReceivablePaymentFormData>({
    resolver: zodResolver(receivablePaymentFormSchema),
    defaultValues: {
      receivableId: "",
      payment: {
        paymentDate: new Date(),
        value: 0,
        observation: "",
      },
    }
  });

  // Filter receivables based on search, status, and date range
  const filteredReceivables = receivables?.filter((receivable: any) => {
    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = receivable.client?.name.toLowerCase().includes(searchLower);
      const descMatch = receivable.description?.toLowerCase().includes(searchLower);
      
      if (!nameMatch && !descMatch) return false;
    }
    
    // Filter by status
    if (selectedStatus && receivable.status !== selectedStatus) {
      return false;
    }
    
    // Filter by date range
    const dueDate = new Date(receivable.dueDate);
    if (dateRange.from && isAfter(dateRange.from, dueDate)) {
      return false;
    }
    
    if (dateRange.to && isAfter(dueDate, dateRange.to)) {
      return false;
    }
    
    return true;
  }) || [];

  // Total amounts for filtered receivables
  const totalAmount = filteredReceivables.reduce((sum, item: any) => sum + Number(item.totalValue), 0);
  const totalReceived = filteredReceivables.reduce((sum, item: any) => sum + Number(item.receivedValue), 0);
  const totalPending = totalAmount - totalReceived;

  const handlePaymentClick = (receivable: any) => {
    setSelectedReceivable(receivable);
    const remainingValue = Number(receivable.totalValue) - Number(receivable.receivedValue);
    
    form.reset({
      receivableId: receivable.id,
      payment: {
        paymentDate: new Date(),
        value: remainingValue,
        observation: "",
      },
    });
    
    setIsPaymentFormOpen(true);
  };

  const onSubmitPayment = async (data: ReceivablePaymentFormData) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, we would call an API endpoint
      // await apiRequest("POST", "/api/receivable-payments", data);
      
      // For now, we'll simulate success
      setTimeout(() => {
        // Update local data
        const updatedReceivables = receivables.map((r: any) => {
          if (r.id === data.receivableId) {
            const newReceivedValue = Number(r.receivedValue) + Number(data.payment.value);
            const newStatus = 
              newReceivedValue >= Number(r.totalValue) ? "RECEIVED" : 
              newReceivedValue > 0 ? "PARTIAL_RECEIVED" : r.status;
            
            const newPayment = {
              id: String(Date.now()),
              paymentDate: data.payment.paymentDate.toISOString(),
              value: data.payment.value,
              observation: data.payment.observation || null
            };
            
            return {
              ...r,
              receivedValue: newReceivedValue,
              status: newStatus,
              payments: [...r.payments, newPayment]
            };
          }
          return r;
        });
        
        queryClient.setQueryData(["/api/receivables"], updatedReceivables);
        
        toast({
          title: "Pagamento registrado",
          description: `Pagamento de ${formatCurrency(data.payment.value)} registrado com sucesso`,
        });
        
        setIsPaymentFormOpen(false);
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      console.error("Error registering payment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Function to get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Em aberto</Badge>;
      case 'PARTIAL_RECEIVED':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Recebido parcial</Badge>;
      case 'RECEIVED':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Recebido</Badge>;
      case 'OVERDUE':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Contas a Receber</CardTitle>
            <CardDescription>
              Gerencie todas as contas a receber da sua empresa
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recebido</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendente</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Buscar por cliente ou descrição"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal w-full md:w-auto">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              <span>Filtros</span>
            </Button>
          </div>

          {/* Status Tabs */}
          <div className="mb-6">
            <Tabs 
              value={selectedStatus || ""} 
              onValueChange={(value) => setSelectedStatus(value === "" ? null : value)}
            >
              <TabsList>
                <TabsTrigger value="">Todos</TabsTrigger>
                <TabsTrigger value="OPEN">Em aberto</TabsTrigger>
                <TabsTrigger value="PARTIAL_RECEIVED">Recebido parcial</TabsTrigger>
                <TabsTrigger value="RECEIVED">Recebido</TabsTrigger>
                <TabsTrigger value="OVERDUE">Vencido</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Receivables Table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredReceivables.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Recebido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceivables.map((receivable: any) => (
                  <TableRow key={receivable.id}>
                    <TableCell className="font-medium">{receivable.client?.name}</TableCell>
                    <TableCell>{receivable.description}</TableCell>
                    <TableCell>{formatDate(receivable.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(receivable.totalValue)}</TableCell>
                    <TableCell>{formatCurrency(receivable.receivedValue)}</TableCell>
                    <TableCell>{getStatusBadge(receivable.status)}</TableCell>
                    <TableCell className="text-right">
                      {receivable.status !== "RECEIVED" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePaymentClick(receivable)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Receber
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-6">
              <p className="text-muted-foreground">Nenhuma conta a receber encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ajuste os filtros ou cadastre novas contas a receber
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Form Dialog */}
      <Dialog open={isPaymentFormOpen} onOpenChange={setIsPaymentFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              {selectedReceivable && (
                <>
                  Cliente: {selectedReceivable.client?.name}<br />
                  Valor total: {formatCurrency(selectedReceivable.totalValue)}<br />
                  Valor pendente: {formatCurrency(Number(selectedReceivable.totalValue) - Number(selectedReceivable.receivedValue))}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitPayment)} className="space-y-6">
              {/* Payment Date */}
              <FormField
                control={form.control}
                name="payment.paymentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Pagamento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Value */}
              <FormField
                control={form.control}
                name="payment.value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Recebido</FormLabel>
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

              {/* Observation */}
              <FormField
                control={form.control}
                name="payment.observation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação</FormLabel>
                    <FormControl>
                      <Input placeholder="Observação opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPaymentFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Pagamento
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
