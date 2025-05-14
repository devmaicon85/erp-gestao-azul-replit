import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings } from "lucide-react";

export function UserProfile() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const userInitial = user.name?.substring(0, 1) || '?';
  
  return (
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Avatar className="h-9 w-9 bg-primary-100 text-primary-700">
          <AvatarFallback>{userInitial}</AvatarFallback>
        </Avatar>
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-gray-700">{user.name}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>
      <button className="p-1 rounded-full text-foreground hover:bg-gray-100">
        <Settings className="h-4 w-4" />
      </button>
    </div>
  );
}
