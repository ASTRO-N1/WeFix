// src/app/components/ui/sidebar.js
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { PanelLeftIcon } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

// Hook to check if the screen is mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: 1023px)`);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    setIsMobile(mql.matches); // Set initial value
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

const SidebarContext = React.createContext(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

function SidebarProvider({ children, defaultOpen = true }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen((prev) => !prev);
    }
  }, [isMobile]);

  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo(
    () => ({ state, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, isMobile, openMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  );
}

function Sidebar({ className, children }) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="left"
          className="w-72 bg-sidebar text-sidebar-foreground p-0 [&>button]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Mobile navigation sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      data-state={state}
      className={cn(
        "hidden lg:flex flex-col bg-[#faf1e0] text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-300",
        state === "expanded" ? "w-64" : "w-20",
        className
      )}
    >
      {children}
    </div>
  );
}

function SidebarTrigger({ className, ...props }) {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-8", className)}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeftIcon className="h-5 w-5" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarHeader({ className, children }) {
  const { state } = useSidebar();
  return (
    <div
      className={cn(
        "flex h-16 items-center border-b border-sidebar-border px-6",
        className
      )}
    >
      {children}
    </div>
  );
}

function SidebarContent({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-1 flex-col gap-2 overflow-auto", className)}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }) {
  return (
    <div
      className={cn("relative flex w-full min-w-0 flex-col py-2", className)}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }) {
  return <div className={cn("w-full text-sm px-4", className)} {...props} />;
}

function SidebarMenu({ className, ...props }) {
  return (
    <ul
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }) {
  return (
    <li className={cn("group/menu-item relative", className)} {...props} />
  );
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring active:bg-sidebar-accent disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      isActive: {
        true: "bg-sidebar-primary text-sidebar-primary-foreground",
        false: "text-sidebar-foreground",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  }
);

function SidebarMenuButton({
  asChild = false,
  isActive,
  className,
  children,
  ...props
}) {
  const { state } = useSidebar();
  const Comp = asChild ? Slot : "button";

  const content = (
    <Comp
      className={cn(sidebarMenuButtonVariants({ isActive }), className)}
      {...props}
    >
      {children}
    </Comp>
  );

  // Extract icon and text for tooltip
  const icon = React.Children.toArray(children).find(
    (child) =>
      React.isValidElement(child) && child.props.className?.includes("h-4")
  );
  const text = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === "span"
  );

  if (state === "collapsed") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" align="center">
          {text}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function SidebarFooter({ className, children }) {
  return (
    <div className={cn("mt-auto border-t border-sidebar-border", className)}>
      {children}
    </div>
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
