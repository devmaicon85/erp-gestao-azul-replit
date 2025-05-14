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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, Plus, X, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const phoneSchema = z.object({
  number: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  isPrimary: z.boolean().default(false),
});

const addressSchema = z.object({
  name: z.string().default("Endereço 01"),
  zipCode: z.string().optional(),
  street: z.string().min(3, "Logradouro é obrigatório"),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  reference: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

const contactSchema = z.object({
  name: z.string().min(3, "Nome é obrigatório"),
  type: z.enum(["CLIENT", "SUPPLIER", "EMPLOYEE", "CARRIER", "CONTACT"]),
  document: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal('')),
  birthDate: z.string().optional(),
  observation: z.string().optional(),
  isDeliveryPerson: z.boolean().default(false),
  phones: z.array(phoneSchema).optional(),
  addresses: z.array(addressSchema).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContactForm({ contact, isOpen, onClose, onSuccess }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      type: "CLIENT",
      document: "",
      email: "",
      birthDate: "",
      observation: "",
      isDeliveryPerson: false,
      phones: [{ number: "", isPrimary: true }],
      addresses: [{
        name: "Endereço 01",
        zipCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        reference: "",
        isPrimary: true
      }],
    }
  });

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    name: "phones",
    control: form.control,
  });

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
    name: "addresses",
    control: form.control,
  });

  // Set form values when editing
  useEffect(() => {
    if (contact) {
      const formData: ContactFormData = {
        name: contact.name || "",
        type: contact.type || "CLIENT",
        document: contact.document || "",
        email: contact.email || "",
        birthDate: contact.birthDate ? new Date(contact.birthDate).toISOString().split('T')[0] : "",
        observation: contact.observation || "",
        isDeliveryPerson: contact.isDeliveryPerson || false,
        phones: contact.phones?.length ? contact.phones : [{ number: "", isPrimary: true }],
        addresses: contact.addresses?.length ? contact.addresses : [{
          name: "Endereço 01",
          zipCode: "",
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: "",
          state: "",
          reference: "",
          isPrimary: true
        }],
      };
      form.reset(formData);
    }
  }, [contact, form]);

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      if (contact?.id) {
        // Update existing contact
        await apiRequest("PUT", `/api/contacts/${contact.id}`, data);
      } else {
        // Create new contact
        await apiRequest("POST", "/api/contacts", data);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      onSuccess();
    } catch (error) {
      console.error("Error saving contact:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPhone = () => {
    appendPhone({ number: "", isPrimary: false });
  };

  const handleAddAddress = () => {
    const addressCount = addressFields.length;
    appendAddress({
      name: `Endereço ${(addressCount + 1).toString().padStart(2, '0')}`,
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      reference: "",
      isPrimary: false
    });
  };

  // Handle primary phone selection
  const handlePrimaryPhoneChange = (index: number, checked: boolean) => {
    if (checked) {
      // Set all other phones to not primary
      const phones = form.getValues("phones");
      phones.forEach((phone, i) => {
        if (i !== index) {
          form.setValue(`phones.${i}.isPrimary`, false);
        }
      });
    }
  };

  // Handle primary address selection
  const handlePrimaryAddressChange = (index: number, checked: boolean) => {
    if (checked) {
      // Set all other addresses to not primary
      const addresses = form.getValues("addresses");
      addresses.forEach((address, i) => {
        if (i !== index) {
          form.setValue(`addresses.${i}.isPrimary`, false);
        }
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? "Editar Contato" : "Novo Contato"}</DialogTitle>
          <DialogDescription>
            Preencha os dados do contato abaixo. Apenas o nome é obrigatório.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do contato" {...field} />
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
                    <FormLabel>Tipo de Contato</FormLabel>
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
                        <SelectItem value="CLIENT">Cliente</SelectItem>
                        <SelectItem value="SUPPLIER">Fornecedor</SelectItem>
                        <SelectItem value="EMPLOYEE">Colaborador</SelectItem>
                        <SelectItem value="CARRIER">Transportador</SelectItem>
                        <SelectItem value="CONTACT">Contato Geral</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Document */}
              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento (CPF/CNPJ)</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00 ou 00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="exemplo@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Birth Date */}
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Delivery Person */}
              <FormField
                control={form.control}
                name="isDeliveryPerson"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Entregador
                      </FormLabel>
                      <FormDescription>
                        Marque se este contato for um entregador
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Phones Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <FormLabel className="text-base">Telefones</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPhone}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar telefone
                </Button>
              </div>
              
              <div className="space-y-3">
                {phoneFields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
                    <FormField
                      control={form.control}
                      name={`phones.${index}.number`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`phones.${index}.isPrimary`}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                handlePrimaryPhoneChange(index, !!checked);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer text-sm">Principal</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    {phoneFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePhone(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Addresses Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <FormLabel className="text-base">Endereços</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAddress}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar endereço
                </Button>
              </div>
              
              <div className="space-y-4">
                {addressFields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-md p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Nome do endereço" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.isPrimary`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  handlePrimaryAddressChange(index, !!checked);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer">Principal</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      {addressFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAddress(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.zipCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input placeholder="00000-000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.street`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Logradouro*</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua, Avenida, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.number`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.complement`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input placeholder="Apto, Sala, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.neighborhood`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input placeholder="Bairro" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.city`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Cidade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.state`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UF</FormLabel>
                            <FormControl>
                              <Input placeholder="UF" maxLength={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`addresses.${index}.reference`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referência</FormLabel>
                          <FormControl>
                            <Input placeholder="Ponto de referência" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Observation */}
            <FormField
              control={form.control}
              name="observation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre o contato"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {contact ? "Atualizar" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
