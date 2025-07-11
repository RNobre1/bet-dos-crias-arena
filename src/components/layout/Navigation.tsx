
import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Users, Calendar, TrendingUp, LogOut } from "lucide-react";

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const { profile, signOut } = useAuth();

  const menuItems = [
    { id: 'classificacao', label: 'Classificação', icon: Trophy },
    { id: 'escalacoes', label: 'Escalações', icon: Users },
    { id: 'apostas', label: 'Apostas', icon: TrendingUp },
    { id: 'historico', label: 'Histórico', icon: Calendar },
  ];

  if (profile?.role === 'ADMIN') {
    menuItems.push({ id: 'admin', label: 'Admin', icon: Users });
  }

  return (
    <div className="bg-green-800 text-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold">BET DOS CRIAS</h1>
          <nav className="flex space-x-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "secondary" : "ghost"}
                  onClick={() => onPageChange(item.id)}
                  className="text-white hover:bg-green-700"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm opacity-90">@{profile?.username}</p>
            <p className="text-xs text-green-200">Saldo: R$ {profile?.saldo_ficticio?.toFixed(2)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-white hover:bg-green-700"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
