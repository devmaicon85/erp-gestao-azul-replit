import { useState } from "react";
import AppShell from "@/components/layout/app-shell";
import PaymentMethods from "@/components/finance/payment-methods";
import Receivables from "@/components/finance/receivables";
import CashRegister from "@/components/finance/cash-register";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("receivables");

  return (
    <AppShell currentModule="finance">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-foreground">Financeiro</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="receivables">Contas a Receber</TabsTrigger>
                <TabsTrigger value="paymentMethods">Formas de Pagamento</TabsTrigger>
                <TabsTrigger value="cashRegister">Caixa</TabsTrigger>
              </TabsList>
              
              <TabsContent value="receivables">
                <Receivables />
              </TabsContent>
              
              <TabsContent value="paymentMethods">
                <PaymentMethods />
              </TabsContent>
              
              <TabsContent value="cashRegister">
                <CashRegister />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
