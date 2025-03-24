import * as React from "react";
import { ChevronsUpDown, Plus, AlertCircle } from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";
import config from "@/config";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface Customer {
  id: string;
  name: string;
  logo: string;
  plan: string;
}

// Map of logo strings to logo components - update this based on your needs
const logoMap: { [key: string]: React.ElementType } = {
  "default-logo": () => <div className="size-4" />,
  // Add more logo mappings as needed
};

export function CustomerSwitcher() {
  const { isMobile } = useSidebar();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [activeCustomer, setActiveCustomer] = React.useState<Customer | null>(
    null
  );
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCustomers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { tokens } = await fetchAuthSession();
      const idToken = tokens?.idToken?.toString();

      if (!idToken) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(`${config.apiUrl}/customers`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response?.ok) {
        throw new Error(`HTTP error happened with status: ${response?.status}`);
      }

      const data = await response.json();
      setCustomers(data);

      // Set the first customer as active if we don't have an active customer
      if (!activeCustomer && data.length > 0) {
        setActiveCustomer(data[0]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch customers"
      );
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  }, [activeCustomer]);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="animate-pulse bg-sidebar-primary/50 size-8 rounded-lg" />
            <div className="flex-1">
              <div className="h-4 w-24 animate-pulse rounded bg-sidebar-primary/50" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (error) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" onClick={fetchCustomers}>
            <div className="bg-destructive/10 text-destructive flex size-8 items-center justify-center rounded-lg">
              <AlertCircle className="size-4" />
            </div>
            <div className="flex-1 text-left text-sm">
              <span className="font-medium">Error loading customers</span>
              <span className="text-xs">Click to retry</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!activeCustomer) {
    return null;
  }

  const LogoComponent = logoMap[activeCustomer.logo] || logoMap["default-logo"];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-lg">
                <LogoComponent />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeCustomer.name}
                </span>
                <span className="truncate text-xs">{activeCustomer.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Customers
            </DropdownMenuLabel>
            {customers.map((customer, index) => {
              const CustomerLogo =
                logoMap[customer.logo] || logoMap["default-logo"];
              return (
                <DropdownMenuItem
                  key={customer.id}
                  onClick={() => {
                    setActiveCustomer(customer);
                    setOpen(false);
                  }}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <CustomerLogo className="size-3.5 shrink-0" />
                  </div>
                  {customer.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Add customer
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default CustomerSwitcher;
