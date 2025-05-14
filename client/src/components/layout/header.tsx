import { useState } from "react";
import { MenuIcon, Search, Bell, HelpCircle, Menu, AlignJustify, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

type HeaderProps = {
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  sidebarOpen: boolean;
};

export default function Header({ toggleSidebar, toggleMobileMenu, sidebarOpen }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/auth");
  };
  
  return (
    <div className="border-b border-gray-200 bg-white lg:border-b lg:border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex items-center lg:hidden">
              <button onClick={toggleMobileMenu} className="p-2 rounded-md text-foreground hover:bg-gray-100 hover:text-foreground-dark">
                <MenuIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="hidden lg:flex items-center">
              <button onClick={toggleSidebar} className="p-2 rounded-md text-foreground hover:bg-gray-100 hover:text-foreground-dark">
                {sidebarOpen ? <AlignJustify className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center lg:justify-start px-2 lg:ml-6">
              <div className="max-w-lg w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Pesquisar..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <button className="p-2 rounded-md text-foreground hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md text-foreground hover:bg-gray-100 ml-2">
              <HelpCircle className="h-5 w-5" />
            </button>
            <div className="ml-2 relative flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-md p-1">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                      <span>{user?.name?.substring(0, 1)}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Perfil</DropdownMenuItem>
                  <DropdownMenuItem>Configurações</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
