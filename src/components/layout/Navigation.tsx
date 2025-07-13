
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Users, TrendingUp, LogOut, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const { profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'classificacao', label: 'Classificação', icon: Trophy },
    { id: 'escalacoes', label: 'Escalações', icon: Users },
    { id: 'apostas', label: 'Apostas', icon: TrendingUp },
  ];

  if (profile?.role === 'ADMIN') {
    menuItems.push({ id: 'admin', label: 'Admin', icon: Users });
  }

  const handleMenuClick = (itemId: string) => {
    onPageChange(itemId);
    setIsMenuOpen(false);
  };

  if (isMobile) {
    return (
      <div className="bg-green-800 text-white">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold">PRO VÁRZEA</h1>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-xs opacity-90">@{profile?.username}</p>
              <p className="text-xs text-green-200">C$ {profile?.saldo_ficticio?.toFixed(2)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-green-700 p-2"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t border-green-700 bg-green-900">
            <nav className="flex flex-col p-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "secondary" : "ghost"}
                    onClick={() => handleMenuClick(item.id)}
                    className="justify-start text-white hover:bg-green-700 mb-1 py-3"
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                );
              })}
              <div className="border-t border-green-700 mt-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={signOut}
                  className="justify-start text-white hover:bg-green-700 w-full py-3"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sair
                </Button>
              </div>
            </nav>
          </div>
        )}

        {/* Bottom Navigation for Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-green-800 border-t border-green-700 z-50 md:hidden">
          <div className="flex justify-around py-2">
            {menuItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleMenuClick(item.id)}
                  className={`flex flex-col items-center text-xs p-2 text-white hover:bg-green-700 ${
                    currentPage === item.id ? 'bg-green-700' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="bg-green-800 text-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold">PRO VÁRZEA</h1>
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
            <p className="text-xs text-green-200">Saldo: C$ {profile?.saldo_ficticio?.toFixed(2)}</p>
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
