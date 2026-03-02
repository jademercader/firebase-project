'use client';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Stethoscope, LayoutDashboard, UploadCloud, FileText, Settings, HelpCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/upload', label: 'Upload Data', icon: UploadCloud },
    { href: '/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
            <Stethoscope className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-black tracking-tight font-headline text-sidebar-foreground">
              City Health
            </h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-sidebar-foreground/60">Insights Platform</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
                className="transition-all duration-200"
              >
                <Link href={item.href}>
                  <item.icon className={pathname === item.href ? "text-primary" : ""} />
                  <span className="font-bold">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/settings'}
              tooltip="Settings"
            >
              <Link href="/settings">
                <Settings />
                <span className="font-bold">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/help'}
              tooltip="Help"
            >
              <Link href="/help">
                <HelpCircle />
                <span className="font-bold">Help Center</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
