import Link from "next/link";

const sections = [
  {
    label: "01 / Overview",
    items: [{ name: "Today", href: "/" }],
  },
  {
    label: "02 / Communication",
    items: [
      { name: "Email", href: "/email" },
      { name: "Messages", href: "/messages" },
    ],
  },
  {
    label: "03 / Social",
    items: [
      { name: "Instagram", href: "/instagram" },
      { name: "Posts", href: "/posts" },
    ],
  },
  {
    label: "04 / Business",
    items: [
      { name: "Companies", href: "/companies" },
      { name: "Invoices", href: "/invoices" },
      { name: "Clients", href: "/clients" },
    ],
  },
  {
    label: "05 / System",
    items: [
      { name: "Settings", href: "/settings" },
      { name: "Account", href: "/account" },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r rule flex flex-col h-screen sticky top-0">
      <div className="px-6 pt-8 pb-10">
        <div className="flex items-baseline gap-2">
          <span className="display text-2xl">Orion</span>
          <span className="label">v0.1</span>
        </div>
        <p className="label mt-1">Personal Operating System</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-6 pb-8 space-y-8">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="label mb-3">{section.label}</div>
            <ul className="space-y-1.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block text-[13px] hover:text-[var(--color-navy)] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t rule px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[var(--color-navy)] flex items-center justify-center text-[var(--color-paper)] text-[11px] font-bold">
            O
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium truncate">Owner</div>
            <div className="label">Online</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
