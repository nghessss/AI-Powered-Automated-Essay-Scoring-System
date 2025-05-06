"use client"

import { ReactNode, useState } from "react"
import SessionsSidebar from "@/components/SessionsSidebar"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function SidebarShell({
  children,
}: {
  children: ReactNode
}) {
  // state to control collapse/expand
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen">
      {/* Sidebar panel */}
      <aside
        className={
          `flex flex-col bg-card border-r transition-width duration-200 ` +
          (collapsed ? "w-16" : "w-64")
        }
      >
        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 m-2 rounded hover:bg-muted"
          aria-label={collapsed ? "Open sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Only render the session list when not collapsed */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto">
            <SessionsSidebar />
          </div>
        )}
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
