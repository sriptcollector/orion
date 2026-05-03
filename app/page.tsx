import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Module, Stat, Row } from "./components/Module";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Topbar />

        <div className="px-10 py-12">
          {/* Hero */}
          <section className="grid grid-cols-12 gap-6 pb-16 border-b rule">
            <div className="col-span-12 lg:col-span-8">
              <div className="label mb-4">Today / Overview</div>
              <h1 className="display text-7xl lg:text-8xl">
                Good morning.
                <br />
                <span className="text-[var(--color-mute)]">3 things need you.</span>
              </h1>
            </div>
            <aside className="col-span-12 lg:col-span-4 flex flex-col justify-end gap-6 lg:border-l rule lg:pl-6">
              <div>
                <div className="label mb-2">Focus</div>
                <p className="text-[15px] leading-snug">
                  Ship the new invoice template. Reply to two pending threads. Post the studio
                  reel before 6pm.
                </p>
              </div>
            </aside>
          </section>

          {/* Stats strip */}
          <section className="grid grid-cols-2 lg:grid-cols-4 border-b rule">
            <div className="px-6 py-8 border-r rule">
              <Stat value="12" label="Unread email" delta="+3 today" />
            </div>
            <div className="px-6 py-8 border-r rule">
              <Stat value="€8,450" label="Pending invoices" />
            </div>
            <div className="px-6 py-8 border-r rule">
              <Stat value="4" label="Drafts" />
            </div>
            <div className="px-6 py-8">
              <Stat value="2" label="Calls today" />
            </div>
          </section>

          {/* Modules */}
          <section className="grid grid-cols-12 gap-6 mt-10">
            <Module
              index="01"
              title="Inbox"
              meta="12 unread"
              className="col-span-12 lg:col-span-7"
            >
              <div className="space-y-0">
                <Row meta="09:42" left="Maria Balea — Re: Sidequests catalogue" right="Email" />
                <Row meta="08:11" left="Stripe — Payout of €2,300 sent" right="Notice" />
                <Row meta="Yest." left="George Cringașu — invoice attached" right="Email" />
                <Row meta="Yest." left="Adrian Ganea — studio walkthrough?" right="Email" />
                <Row meta="2d" left="Apple Developer — receipt" right="Receipt" />
              </div>
            </Module>

            <Module
              index="02"
              title="Compose"
              className="col-span-12 lg:col-span-5"
              action={<span className="label">Quick send</span>}
            >
              <div className="flex flex-col gap-3 h-full">
                <input
                  placeholder="To"
                  className="border-b rule bg-transparent text-[13px] py-2 focus:outline-none focus:border-[var(--color-ink)]"
                />
                <input
                  placeholder="Subject"
                  className="border-b rule bg-transparent text-[13px] py-2 focus:outline-none focus:border-[var(--color-ink)]"
                />
                <textarea
                  placeholder="Message"
                  rows={5}
                  className="border-b rule bg-transparent text-[13px] py-2 resize-none focus:outline-none focus:border-[var(--color-ink)]"
                />
                <div className="flex items-center justify-between mt-auto pt-3">
                  <span className="label">Draft saves automatically</span>
                  <button className="text-[12px] bg-[var(--color-navy)] text-[var(--color-paper)] px-4 py-1.5 hover:bg-[var(--color-navy-hover)] transition-colors">
                    Send
                  </button>
                </div>
              </div>
            </Module>

            <Module
              index="03"
              title="Invoices"
              meta="€8,450 pending"
              className="col-span-12 lg:col-span-5"
            >
              <div className="space-y-0">
                <Row meta="#0142" left="Zina Gallery — branding" right="€2,400 · due 7d" />
                <Row meta="#0141" left="Lupa Studio — retainer" right="€3,200 · due 14d" />
                <Row meta="#0140" left="Atelier Nord — print run" right="€1,150 · due 21d" />
                <Row meta="#0139" left="Self — equipment" right="€1,700 · paid" />
              </div>
            </Module>

            <Module
              index="04"
              title="Social — Instagram"
              className="col-span-12 lg:col-span-7"
              action={<span className="label">Connect account</span>}
            >
              <div className="grid grid-cols-3 gap-3 h-full">
                <div className="aspect-square bg-[var(--color-rule)] flex items-end p-3">
                  <span className="label">Draft 01</span>
                </div>
                <div className="aspect-square bg-[var(--color-rule)] flex items-end p-3">
                  <span className="label">Draft 02</span>
                </div>
                <div className="aspect-square bg-[var(--color-rule)] flex items-end p-3">
                  <span className="label">Draft 03</span>
                </div>
                <div className="col-span-3 border-t rule pt-3 flex items-center justify-between">
                  <span className="text-[12px] text-[var(--color-mute)]">
                    Schedule directly from drafts
                  </span>
                  <button className="text-[12px] border rule px-3 py-1.5 hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors">
                    Upload
                  </button>
                </div>
              </div>
            </Module>

            <Module
              index="05"
              title="Companies"
              meta="3 active"
              className="col-span-12 lg:col-span-6"
            >
              <div className="grid grid-cols-3 gap-0">
                <div className="border-r rule pr-4">
                  <div className="display text-3xl num">€12.4k</div>
                  <div className="label mt-2">Studio · MTD</div>
                </div>
                <div className="border-r rule px-4">
                  <div className="display text-3xl num">€3.1k</div>
                  <div className="label mt-2">Consulting · MTD</div>
                </div>
                <div className="pl-4">
                  <div className="display text-3xl num">€0.8k</div>
                  <div className="label mt-2">Shop · MTD</div>
                </div>
              </div>
            </Module>

            <Module
              index="06"
              title="Schedule"
              meta="Today"
              className="col-span-12 lg:col-span-6"
            >
              <div className="space-y-0">
                <Row meta="11:00" left="Studio sync" right="30m" />
                <Row meta="14:30" left="Maria — invoice review" right="45m" />
                <Row meta="17:00" left="Gym" right="60m" />
                <Row meta="20:00" left="Dinner with G." right="—" />
              </div>
            </Module>
          </section>

          {/* Footer rule */}
          <footer className="mt-16 pt-6 border-t rule flex items-center justify-between">
            <div className="label">Orion / Personal Operating System</div>
            <div className="label num">Build 0.1.0 · {new Date().getFullYear()}</div>
          </footer>
        </div>
      </main>
    </div>
  );
}
