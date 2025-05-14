import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Landmark } from "lucide-react";

export default function FinancialOverview() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
      {/* Receivables Card */}
      <Card>
        <CardContent className="px-4 py-5 sm:p-6">
          <CardTitle className="text-lg leading-6 font-medium text-foreground-dark">Contas a Receber</CardTitle>
          <div className="mt-2 flex justify-between">
            <dl>
              <dt className="text-sm font-medium text-foreground-light">Pendentes</dt>
              <dd className="mt-1 text-2xl font-semibold text-foreground-dark">{formatCurrency(3450)}</dd>
            </dl>
            <div className="h-16 w-16 bg-primary-50 rounded-full flex items-center justify-center">
              <CreditCard className="text-primary-500 h-8 w-8" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a href="/finance" className="font-medium text-primary-600 hover:text-primary-700">
              Ver detalhes <span aria-hidden="true">→</span>
            </a>
          </div>
        </CardFooter>
      </Card>

      {/* Cash Register Card */}
      <Card>
        <CardContent className="px-4 py-5 sm:p-6">
          <CardTitle className="text-lg leading-6 font-medium text-foreground-dark">Status do Caixa</CardTitle>
          <div className="mt-2 flex justify-between">
            <dl>
              <dt className="text-sm font-medium text-foreground-light">Atual</dt>
              <dd className="mt-1 text-2xl font-semibold text-foreground-dark">{formatCurrency(1250)}</dd>
            </dl>
            <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center">
              <Landmark className="text-green-500 h-8 w-8" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm flex justify-between w-full">
            <a href="/finance" className="font-medium text-primary-600 hover:text-primary-700">
              Ver movimentações
            </a>
            <a href="/finance" className="font-medium text-red-600 hover:text-red-700">
              Fechar caixa
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
