import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CalendarIcon, Search, Plus, X, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1, "Quantidade deve ser pelo menos 1"),
  unitPrice: z.number().min(0, "Preço deve ser maior ou igual a zero"),
  totalPrice: z.number().min(0, "Total deve ser maior ou igual a zero"),
  productName: z.string().optional(), // For display only
});

const orderPaymentSchema = z.object({
  paymentMethodId: z.string(),
  value: z.number().min(0, "Valor deve ser maior ou igual a zero"),
  change: z.number().min(0, "Troco deve ser maior ou igual a zero"),
  methodName: z.string().optional(), // For display only
});

const orderSchema = z.object({
  orderDate: z.date(),
  clientId: z.string().min(1, "Cliente é obrigatório"),
  addressId: z.string().min(1, "Endereço de entrega é obrigatório"),
  priceTableId: z.string().optional().nullable(),
  deliveryFee: z.number().min(0, "Taxa de entrega deve ser maior ou igual a zero"),
  totalValue: z.number().min(0, "Valor total deve ser maior ou igual a zero"),
  status: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "Adicione pelo menos um produto"),
  payments: z.array(orderPaymentSchema).min(1, "Adicione pelo menos uma forma de pagamento"),
  deliveryPersonId: z.string().optional().nullable(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OrderForm({ order, isOpen, onClose, onSuccess }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchClient, setSearchClient] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Fetch clients (contacts)
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/contacts", { type: "CLIENT", status: 1 }],
    enabled: isOpen,
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products", { status: 1 }],
    enabled: isOpen,
  });

  // Fetch price tables
  const { data: priceTables } = useQuery({
    queryKey: ["/api/price-tables"],
    enabled: isOpen,
  });

  // Fetch payment methods
  const { data: paymentMethods } = useQuery({
    queryKey: ["/api/payment-methods"],
    enabled: isOpen,
    // Mock data since API endpoint isn't implemented yet
    initialData: [
      { id: "1", name: "Dinheiro", type: "CASH" },
      { id: "2", name: "Cartão de Crédito", type: "CREDIT_CARD" },
      { id: "3", name: "Cartão de Débito", type: "DEBIT_CARD" },
      { id: "4", name: "PIX", type: "PIX" },
      { id: "5", name: "A Receber", type: "RECEIVABLE" },
    ],
  });

  // Fetch delivery people
  const { data: deliveryPeople } = useQuery({
    queryKey: ["/api/contacts", { type: "EMPLOYEE", isDeliveryPerson: true, status: 1 }],
    enabled: isOpen,
    // Mock data since API endpoint parameter isn't implemented yet
    initialData: [
      { id: "1", name: "João Entregador" },
      { id: "2", name: "Maria Entregadora" },
      { id: "3", name: "Carlos Motoboy" },
    ],
  });

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderDate: new Date(),
      clientId: "",
      addressId: "",
      priceTableId: null,
      deliveryFee: 0,
      totalValue: 0,
      status: "NEW",
      items: [],
      payments: [{ paymentMethodId: "1", value: 0, change: 0, methodName: "Dinheiro" }],
      deliveryPersonId: null,
    }
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    name: "items",
    control: form.control,
  });

  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    name: "payments",
    control: form.control,
  });

  // Set form values when editing
  useEffect(() => {
    if (order) {
      const formData: Partial<OrderFormData> = {
        orderDate: new Date(order.orderDate),
        clientId: order.clientId,
        addressId: order.addressId,
        priceTableId: order.priceTableId,
        deliveryFee: Number(order.deliveryFee),
        totalValue: Number(order.totalValue),
        status: order.status,
        items: order.items?.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          productName: item.product?.name,
        })) || [],
        payments: order.payments?.map((payment: any) => ({
          paymentMethodId: payment.paymentMethodId,
          value: Number(payment.value),
          change: Number(payment.change),
          methodName: payment.paymentMethod?.name,
        })) || [{ paymentMethodId: "1", value: Number(order.totalValue), change: 0, methodName: "Dinheiro" }],
        deliveryPersonId: order.delivery?.deliveryPersonId,
      };

      // Find and set the selected client
      if (clients) {
        const client = clients.find((c: any) => c.id === order.clientId);
        if (client) {
          setSelectedClient(client);
        }
      }

      form.reset(formData as OrderFormData);
    }
  }, [order, form, clients]);

  // Watch form values to calculate totals
  const watchItems = form.watch("items");
  const watchPayments = form.watch("payments");
  const watchDeliveryFee = form.watch("deliveryFee");

  // Calculate total value whenever items or delivery fee change
  useEffect(() => {
    const itemsTotal = watchItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const total = itemsTotal + (watchDeliveryFee || 0);
    form.setValue("totalValue", total);

    // Update the first payment value if there's only one payment method
    if (watchPayments.length === 1) {
      form.setValue("payments.0.value", total);
    }
  }, [watchItems, watchDeliveryFee, form, watchPayments.length]);

  // Calculate change for cash payments
  useEffect(() => {
    const total = form.getValues("totalValue");
    const totalPaid = watchPayments.reduce((sum, payment) => sum + payment.value, 0);
    
    // Only calculate change for cash payments
    const cashPayment = watchPayments.find(p => p.paymentMethodId === "1");
    if (cashPayment) {
      const paymentIndex = watchPayments.indexOf(cashPayment);
      const change = totalPaid > total ? totalPaid - total : 0;
      form.setValue(`payments.${paymentIndex}.change`, change);
    }
  }, [watchPayments, form]);

  // Filter clients based on search
  const filteredClients = clients?.filter((client: any) => {
    if (!searchClient) return true;
    const searchLower = searchClient.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      (client.document && client.document.toLowerCase().includes(searchLower)) ||
      (client.email && client.email.toLowerCase().includes(searchLower))
    );
  }) || [];

  // Filter products based on search
  const filteredProducts = products?.filter((product: any) => {
    if (!searchProduct) return true;
    const searchLower = searchProduct.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.internalCode && product.internalCode.toLowerCase().includes(searchLower)) ||
      (product.barCode && product.barCode.toLowerCase().includes(searchLower))
    );
  }) || [];

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    form.setValue("clientId", client.id);
    
    // If client has addresses, select the primary one or the first one
    if (client.addresses && client.addresses.length > 0) {
      const primaryAddress = client.addresses.find((addr: any) => addr.isPrimary) || client.addresses[0];
      form.setValue("addressId", primaryAddress.id);
    } else {
      form.setValue("addressId", "");
    }
    
    setShowClientSearch(false);
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    
    // Find the default price
    const defaultPrice = product.priceItems?.find((item: any) => item.priceTable.isDefault)?.price 
                       || product.costValue * 1.3; // 30% markup as fallback
    
    appendItem({
      productId: product.id,
      quantity: 1,
      unitPrice: Number(defaultPrice || 0),
      totalPrice: Number(defaultPrice || 0),
      productName: product.name,
    });
    
    setShowProductSearch(false);
    setSearchProduct("");
  };

  const handleQuantityChange = (index: number, value: number) => {
    const unitPrice = form.getValues(`items.${index}.unitPrice`);
    form.setValue(`items.${index}.quantity`, value);
    form.setValue(`items.${index}.totalPrice`, value * unitPrice);
  };

  const handleUnitPriceChange = (index: number, value: number) => {
    const quantity = form.getValues(`items.${index}.quantity`);
    form.setValue(`items.${index}.unitPrice`, value);
    form.setValue(`items.${index}.totalPrice`, quantity * value);
  };

  const handleAddPaymentMethod = () => {
    const total = form.getValues("totalValue");
    const totalPaid = watchPayments.reduce((sum, payment) => sum + payment.value, 0);
    const remaining = total - totalPaid > 0 ? total - totalPaid : 0;
    
    // Find an unused payment method
    const usedMethodIds = watchPayments.map(p => p.paymentMethodId);
    const availableMethod = paymentMethods?.find((m: any) => !usedMethodIds.includes(m.id));
    
    if (availableMethod) {
      appendPayment({
        paymentMethodId: availableMethod.id,
        value: remaining,
        change: 0,
        methodName: availableMethod.name,
      });
    }
  };

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);
    try {
      if (order?.id) {
        // Update existing order
        await apiRequest("PUT", `/api/orders/${order.id}`, data);
      } else {
        // Create new order
        await apiRequest("POST", "/api/orders", data);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      onSuccess();
    } catch (error) {
      console.error("Error saving order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Editar Pedido" : "Novo Pedido"}</DialogTitle>
          <DialogDescription>
            Preencha os dados do pedido abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Order Date */}
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Pedido</FormLabel>
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

              {/* Price Table */}
              <FormField
                control={form.control}
                name="priceTableId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tabela de Preços</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a tabela" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Tabela Padrão</SelectItem>
                        {priceTables?.map((table: any) => (
                          <SelectItem key={table.id} value={table.id}>
                            {table.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tabela de preços para este pedido
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Client Selection */}
            <div className="space-y-2">
              <FormLabel>Cliente*</FormLabel>
              {selectedClient ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{selectedClient.name}</h3>
                        {selectedClient.document && (
                          <p className="text-sm text-muted-foreground">
                            Documento: {selectedClient.document}
                          </p>
                        )}
                        {selectedClient.email && (
                          <p className="text-sm text-muted-foreground">
                            E-mail: {selectedClient.email}
                          </p>
                        )}
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedClient(null);
                          form.setValue("clientId", "");
                          form.setValue("addressId", "");
                          setShowClientSearch(true);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Trocar
                      </Button>
                    </div>

                    {/* Address Selection */}
                    {selectedClient.addresses && selectedClient.addresses.length > 0 ? (
                      <div className="mt-4">
                        <FormField
                          control={form.control}
                          name="addressId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endereço de Entrega*</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o endereço" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {selectedClient.addresses.map((address: any) => (
                                    <SelectItem key={address.id} value={address.id}>
                                      {address.name}: {address.street}, {address.number} {address.neighborhood && `- ${address.neighborhood}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 p-2 bg-yellow-50 text-yellow-700 text-sm rounded">
                        Este cliente não possui endereços cadastrados. 
                        <Button variant="link" className="h-auto p-0 ml-1">
                          Adicionar Endereço
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      value={searchClient}
                      onChange={(e) => setSearchClient(e.target.value)}
                      placeholder="Buscar cliente por nome, telefone ou documento"
                      className="pl-10"
                      onFocus={() => setShowClientSearch(true)}
                    />
                  </div>
                  
                  {showClientSearch && (
                    <Card className="mt-2 absolute z-20 w-full max-w-md">
                      <CardContent className="p-0">
                        <ScrollArea className="h-64">
                          {clientsLoading ? (
                            <div className="p-4 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                              <p className="text-sm text-muted-foreground mt-2">
                                Carregando clientes...
                              </p>
                            </div>
                          ) : filteredClients.length > 0 ? (
                            <div className="divide-y">
                              {filteredClients.map((client: any) => (
                                <button
                                  key={client.id}
                                  type="button"
                                  className="w-full text-left p-3 hover:bg-muted flex items-start"
                                  onClick={() => handleSelectClient(client)}
                                >
                                  <div>
                                    <p className="font-medium">{client.name}</p>
                                    {client.phones && client.phones.length > 0 && (
                                      <p className="text-sm text-muted-foreground">
                                        {client.phones[0].number}
                                      </p>
                                    )}
                                    {client.addresses && client.addresses.length > 0 && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {client.addresses[0].street}, {client.addresses[0].number}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">
                                Nenhum cliente encontrado
                              </p>
                              <Button 
                                variant="link" 
                                className="mt-2"
                                type="button"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Cadastrar Novo Cliente
                              </Button>
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              {!selectedClient && form.formState.errors.clientId && (
                <p className="text-sm text-destructive">{form.formState.errors.clientId.message}</p>
              )}
            </div>

            {/* Product Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel className="text-base">Produtos*</FormLabel>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    placeholder="Buscar produto"
                    className="pl-10 w-[250px]"
                    onFocus={() => setShowProductSearch(true)}
                  />
                  
                  {showProductSearch && (
                    <Card className="mt-2 absolute z-20 w-full">
                      <CardContent className="p-0">
                        <ScrollArea className="h-64">
                          {productsLoading ? (
                            <div className="p-4 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                              <p className="text-sm text-muted-foreground mt-2">
                                Carregando produtos...
                              </p>
                            </div>
                          ) : filteredProducts.length > 0 ? (
                            <div className="divide-y">
                              {filteredProducts.map((product: any) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  className="w-full text-left p-3 hover:bg-muted flex justify-between items-center"
                                  onClick={() => handleSelectProduct(product)}
                                >
                                  <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Cód: {product.internalCode}
                                      {product.barCode && ` | EAN: ${product.barCode}`}
                                    </p>
                                  </div>
                                  <span className="font-medium text-sm">
                                    {formatCurrency(product.defaultPrice || 0)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">
                                Nenhum produto encontrado
                              </p>
                              <Button 
                                variant="link" 
                                className="mt-2"
                                type="button"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Cadastrar Novo Produto
                              </Button>
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
              
              {/* Item List */}
              {itemFields.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produto
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qtd
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Preço Unitário
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {itemFields.map((field, index) => (
                        <tr key={field.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {form.getValues(`items.${index}.productName`)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Input
                              type="number"
                              className="w-16 h-8 text-right"
                              min={1}
                              value={form.getValues(`items.${index}.quantity`)}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                            />
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Input
                              type="number"
                              className="w-24 h-8 text-right"
                              min={0}
                              step={0.01}
                              value={form.getValues(`items.${index}.unitPrice`)}
                              onChange={(e) => handleUnitPriceChange(index, parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(form.getValues(`items.${index}.totalPrice`))}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border rounded-md border-dashed p-8 text-center">
                  <p className="text-muted-foreground">Nenhum produto adicionado</p>
                  <p className="text-sm text-muted-foreground">
                    Use a busca acima para adicionar produtos
                  </p>
                </div>
              )}
              {form.formState.errors.items && (
                <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
              )}
            </div>

            {/* Delivery Fee */}
            <FormField
              control={form.control}
              name="deliveryFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Entrega</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Order Total */}
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-medium">Valor Total:</span>
                <span className="text-xl font-bold">
                  {formatCurrency(form.getValues("totalValue"))}
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel className="text-base">Formas de Pagamento*</FormLabel>
                {watchPayments.length < paymentMethods?.length && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPaymentMethod}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Pagamento
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {paymentFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end border p-3 rounded-md">
                    <FormField
                      control={form.control}
                      name={`payments.${index}.paymentMethodId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Forma de Pagamento</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Update method name for display
                              const method = paymentMethods?.find((m: any) => m.id === value);
                              if (method) {
                                form.setValue(`payments.${index}.methodName`, method.name);
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
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
                    
                    <FormField
                      control={form.control}
                      name={`payments.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {form.getValues(`payments.${index}.paymentMethodId`) === "1" && (
                      <FormField
                        control={form.control}
                        name={`payments.${index}.change`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Troco</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                readOnly
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {paymentFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => removePayment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Person */}
            <FormField
              control={form.control}
              name="deliveryPersonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entregador</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o entregador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Selecionar depois</SelectItem>
                      {deliveryPeople?.map((person: any) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    O entregador pode ser definido depois
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {order ? "Atualizar" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
