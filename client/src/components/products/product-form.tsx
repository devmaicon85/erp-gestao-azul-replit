import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

const productSchema = z.object({
  internalCode: z.string().min(1, "Código interno é obrigatório"),
  barCode: z.string().optional(),
  name: z.string().min(3, "Nome é obrigatório"),
  type: z.enum(["SIMPLE", "CONTAINER", "WITH_CONTAINER_RETURN"]),
  costValue: z.string().or(z.number()).transform(value => 
    typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value
  ),
  currentStock: z.string().or(z.number()).transform(value => 
    typeof value === 'string' ? parseInt(value) : value
  ),
  minimumStock: z.string().or(z.number()).transform(value => 
    typeof value === 'string' ? parseInt(value) : value
  ),
  containerProductId: z.string().optional().nullable(),
  defaultPrice: z.string().or(z.number()).transform(value => 
    typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value
  ),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductForm({ product, isOpen, onClose, onSuccess }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch container products (vasilhames) for selection
  const { data: containerProducts, isLoading: isLoadingContainers } = useQuery({
    queryKey: ["/api/products"],
    select: (data) => data.filter((p: any) => p.type === 'CONTAINER'),
    enabled: isOpen, // Only fetch when dialog is open
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      internalCode: "",
      barCode: "",
      name: "",
      type: "SIMPLE",
      costValue: 0,
      currentStock: 0,
      minimumStock: 0,
      containerProductId: null,
      defaultPrice: 0,
    }
  });

  // Set form values when editing
  useEffect(() => {
    if (product) {
      const formData: ProductFormData = {
        internalCode: product.internalCode || "",
        barCode: product.barCode || "",
        name: product.name || "",
        type: product.type || "SIMPLE",
        costValue: product.costValue || 0,
        currentStock: product.currentStock || 0,
        minimumStock: product.minimumStock || 0,
        containerProductId: product.containerProductId || null,
        defaultPrice: product.defaultPrice || 0,
      };
      form.reset(formData);
    }
  }, [product, form]);

  // Watch for product type changes to show/hide container selection
  const productType = form.watch("type");

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      if (product?.id) {
        // Update existing product
        await apiRequest("PUT", `/api/products/${product.id}`, data);
      } else {
        // Create new product
        await apiRequest("POST", "/api/products", data);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          <DialogDescription>
            Preencha os dados do produto abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Internal Code */}
              <FormField
                control={form.control}
                name="internalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Interno*</FormLabel>
                    <FormControl>
                      <Input placeholder="Código interno" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bar Code */}
              <FormField
                control={form.control}
                name="barCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Barras</FormLabel>
                    <FormControl>
                      <Input placeholder="Código de barras" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
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
                    <FormLabel>Tipo de Produto</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SIMPLE">Simples</SelectItem>
                        <SelectItem value="CONTAINER">Vasilhame</SelectItem>
                        <SelectItem value="WITH_CONTAINER_RETURN">Com retorno de vasilhame</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      O tipo define o comportamento do produto durante as vendas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Container Product Selection (only for WITH_CONTAINER_RETURN type) */}
              {productType === "WITH_CONTAINER_RETURN" && (
                <FormField
                  control={form.control}
                  name="containerProductId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vasilhame Associado*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value?.toString() || ''}
                        value={field.value?.toString() || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o vasilhame" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingContainers ? (
                            <SelectItem value="loading" disabled>
                              Carregando vasilhames...
                            </SelectItem>
                          ) : containerProducts?.length ? (
                            containerProducts.map((container: any) => (
                              <SelectItem key={container.id} value={container.id}>
                                {container.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              Nenhum vasilhame cadastrado
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione o vasilhame que será retornado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Cost Value */}
              <FormField
                control={form.control}
                name="costValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor de Custo</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Default Price */}
              <FormField
                control={form.control}
                name="defaultPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Padrão</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Current Stock */}
              <FormField
                control={form.control}
                name="currentStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Atual</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Minimum Stock */}
              <FormField
                control={form.control}
                name="minimumStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Mínimo</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {product ? "Atualizar" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
