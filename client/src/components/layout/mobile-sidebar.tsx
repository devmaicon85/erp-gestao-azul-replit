import { UserProfile } from "./user-profile";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  FileText, 
  DollarSign,
  BarChart3,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

type MobileSidebarProps = {
  isOpen: boolean;
  currentModule: string;
  onClose: () => void;
  onNavigate: (path: string) => void;
};

export default function MobileSidebar({ 
  isOpen, 
  currentModule, 
  onClose, 
  onNavigate 
}: MobileSidebarProps) {
  // Navigation items
  const navItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: "/",
      id: "dashboard"
    },
    {
      name: "Contatos",
      icon: <Users className="h-5 w-5" />,
      path: "/contacts",
      id: "contacts"
    },
    {
      name: "Produtos",
      icon: <ShoppingBag className="h-5 w-5" />,
      path: "/products",
      id: "products"
    },
    {
      name: "Pedidos",
      icon: <FileText className="h-5 w-5" />,
      path: "/orders",
      id: "orders"
    },
    {
      name: "Financeiro",
      icon: <DollarSign className="h-5 w-5" />,
      path: "/finance",
      id: "finance"
    },
    {
      name: "Relatórios",
      icon: <BarChart3 className="h-5 w-5" />,
      path: "/reports",
      id: "reports"
    }
  ];
  
  if (!isOpen) return null;
  
  return (
    <div className="lg:hidden fixed inset-0 z-40 flex">
      {/* Overlay */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-gray-600 bg-opacity-75"
      />

      {/* Menu content */}
      <div className="relative max-w-xs w-full bg-white flex-1 flex flex-col">
        {/* Close button */}
        <div className="absolute top-0 right-0 pt-2 pr-2">
          <button 
            onClick={onClose} 
            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="bg-primary h-8 w-8 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">GA</span>
            </div>
            <span className="text-xl font-semibold text-primary-700">Gestão Azul</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={cn(
                "group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md",
                currentModule === item.id 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-foreground hover:bg-gray-50"
              )}
            >
              {React.cloneElement(item.icon, { 
                className: cn(
                  "mr-3",
                  currentModule === item.id ? "text-primary-700" : "text-foreground"
                )
              })}
              {item.name}
            </button>
          ))}
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-200">
          <UserProfile />
        </div>
      </div>
    </div>
  );
}
