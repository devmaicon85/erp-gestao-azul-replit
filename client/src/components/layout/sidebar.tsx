import { UserProfile } from "./user-profile";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  FileText, 
  DollarSign,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  isOpen: boolean;
  currentModule: string;
  onNavigate: (path: string) => void;
};

export default function Sidebar({ isOpen, currentModule, onNavigate }: SidebarProps) {
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
    <div className="hidden lg:flex lg:flex-col fixed inset-y-0 w-64 bg-white border-r border-gray-200 shadow-sm z-10">
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
  );
}
