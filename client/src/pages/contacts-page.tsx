import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/app-shell";
import ContactList from "@/components/contacts/contact-list";
import ContactForm from "@/components/contacts/contact-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContactsPage() {
  const [selectedContactType, setSelectedContactType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const { toast } = useToast();
  
  // Fetch contacts
  const { data: contacts, isLoading, refetch } = useQuery({
    queryKey: ["/api/contacts", { type: selectedContactType, status: showDeleted ? 0 : 1 }],
  });

  const handleAddContact = () => {
    setEditingContact(null);
    setShowForm(true);
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingContact(null);
    refetch();
    toast({
      title: "Sucesso",
      description: "Contato salvo com sucesso",
    });
  };

  const handleTypeChange = (type: string | null) => {
    setSelectedContactType(type);
  };

  return (
    <AppShell currentModule="contacts">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-foreground">Contatos</h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button onClick={handleAddContact}>
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Novo Contato
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <ContactList 
              contacts={contacts}
              isLoading={isLoading}
              selectedType={selectedContactType}
              onTypeChange={handleTypeChange}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              showDeleted={showDeleted}
              onShowDeletedChange={setShowDeleted}
              onEdit={handleEditContact}
              onRefresh={refetch}
            />

            {showForm && (
              <ContactForm
                contact={editingContact}
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
