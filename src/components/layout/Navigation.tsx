import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Trophy, Users, TrendingUp, Settings, LogOut, User } from "lucide-react";

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const { profile, signOut } = useAuth();
  const isMobile = useIsMobile();

  const navigationItems = [
    { id: 'classificacao', label: 'Classificação', icon: Trophy },
    { id: 'escalacoes', label: 'Escalações', icon: Users },
    { id: 'apostas', label: 'Apostas', icon: TrendingUp },
    ...(profile?.role === 'ADMIN' ? [{ id: 'admin', label: 'Admin', icon: Settings }] : [])
  ];

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                  isActive 
                    ? 'bg-green-700 text-white hover:bg-green-600' 
                    : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-green-800 text-white shadow-lg">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold">PRO VÁRZEA</h1>
            
            <div className="flex space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <Button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    variant="ghost"
                    className={`flex items-center gap-2 ${
                      isActive 
                        ? 'bg-green-700 text-white hover:bg-green-600' 
                        : 'text-green-100 hover:text-white hover:bg-green-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-green-100 hover:text-white hover:bg-green-700">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-green-600 text-white text-sm">
                      {profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span>{profile?.username}</span>
                    <span className="text-xs text-green-200">C$ {(profile?.saldo_ficticio || 0).toFixed(2)}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={signOut}
                  className="flex items-center gap-2 text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;