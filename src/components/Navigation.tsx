import { AppUser } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SignOut, UserCircle, List, Desktop, Users, Gear, Calendar, Moon, Sun, FileXls } from '@phosphor-icons/react';

interface NavigationProps {
  currentUser: AppUser;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenUpload?: () => void;
}

const mainTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'communications', label: 'Communications', icon: '📬' },
  { id: 'reports', label: 'Reports', icon: '📈' },
];

export function Navigation({ currentUser, activeTab, onTabChange, onLogout, darkMode, onToggleDarkMode, onOpenUpload }: NavigationProps) {
  const isMain = mainTabs.some(t => t.id === activeTab);

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Brand + Main Tabs */}
        <div className="flex items-center gap-6">
          <button onClick={() => onTabChange('dashboard')} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
              <span className="text-white text-sm font-bold">◉</span>
            </div>
            <div className="leading-tight">
              <span className="font-bold text-sm text-foreground">LabOps Sentinel</span>
              <span className="block text-[10px] text-muted-foreground uppercase tracking-wider -mt-0.5">Executive View</span>
            </div>
          </button>

          <nav className="flex items-center gap-1">
            {mainTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-[#1e3a5f] text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                <span className="text-xs">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Upload, Dark Mode, More Menu, System, User */}
        <div className="flex items-center gap-3">
          {/* Excel Upload (Admin only) */}
          {currentUser.isAdmin && onOpenUpload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 h-8"
              title="Import/Export Excel Data"
            >
              <FileXls size={16} className="text-green-600" />
              <span className="text-xs hidden md:inline">Import Excel</span>
            </Button>
          )}

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDarkMode}
            className="h-8 w-8 p-0"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-muted-foreground" />}
          </Button>

          {/* More menu for Servers, Bookings, Users, Admin */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={!isMain ? 'secondary' : 'ghost'} size="sm" className="flex items-center gap-1.5 h-8">
                <List size={16} />
                <span className="text-xs">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onTabChange('servers')} className="flex items-center gap-2">
                <Desktop size={14} /> Servers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTabChange('bookings')} className="flex items-center gap-2">
                <Calendar size={14} /> My Bookings
              </DropdownMenuItem>
              {currentUser.isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => onTabChange('users')} className="flex items-center gap-2">
                    <Users size={14} /> Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onTabChange('admin')} className="flex items-center gap-2">
                    <Gear size={14} /> Admin
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Online
          </div>

          <div className="flex items-center gap-2 border-l pl-3 ml-1 border-border">
            <UserCircle size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{currentUser.name}</span>
            {currentUser.isAdmin && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Admin</Badge>}
          </div>

          <Button variant="ghost" size="sm" onClick={onLogout} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500">
            <SignOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}
