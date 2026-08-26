import { AdminHideButton } from "@/components/marketplace/admin-hide-button"
import { Header } from "@/components/marketplace/header"
import { loginAdmin } from "@/app/admin/actions"
import { isAdminAuthenticated } from "@/lib/marketplace/admin-auth"
import { getAdminMarketplaceData } from "@/lib/marketplace/queries"

export const dynamic = "force-dynamic"

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const authenticated = await isAdminAuthenticated()
  const query = await searchParams

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#f6f4ef] text-[#151412]">
        <div className="mx-auto min-h-screen max-w-[1120px] border-x border-black/10 bg-[#fbfaf7]"><Header back />
          <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-sm items-center px-5 py-20">
            <form action={loginAdmin} className="w-full rounded-[14px] border border-black/10 bg-white p-7 shadow-xl">
              <p className="text-xs font-extrabold tracking-[0.14em] text-[#e4573e]">PRIVATE ACCESS</p>
              <h1 className="mt-3 font-instrument-serif text-4xl">STEAL admin.</h1>
              <label className="mt-7 block text-sm font-semibold">Password<input name="password" type="password" required autoFocus className="mt-2 min-h-12 w-full rounded-[10px] border border-black/15 px-3 outline-none focus:border-black" /></label>
              {query.error ? <p className="mt-3 text-sm text-red-700">That password isn&apos;t right.</p> : null}
              {!process.env.STEAL_ADMIN_PASSWORD ? <p className="mt-3 text-sm text-amber-700">Set STEAL_ADMIN_PASSWORD before using admin.</p> : null}
              <button className="mt-5 min-h-12 w-full rounded-[10px] bg-[#151412] text-sm font-bold text-white">ENTER ADMIN</button>
            </form>
          </section>
        </div>
      </main>
    )
  }

  const { opportunities, offers } = await getAdminMarketplaceData()
  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#151412]">
      <div className="mx-auto min-h-screen max-w-[1280px] border-x border-black/10 bg-[#fbfaf7]"><Header back />
        <div className="px-5 py-12 sm:px-8">
          <p className="text-xs font-extrabold tracking-[0.14em] text-[#e4573e]">PRIVATE · MODERATION</p>
          <h1 className="mt-3 font-instrument-serif text-5xl">Marketplace admin.</h1>

          <section className="mt-12"><h2 className="font-instrument-serif text-3xl">Opportunities <span className="text-lg text-[#77726a]">({opportunities.length})</span></h2>
            <div className="mt-4 overflow-x-auto rounded-[12px] border border-black/10 bg-white"><table className="w-full min-w-[1000px] text-left text-xs"><thead className="bg-[#f2f0eb] text-[#68635b]"><tr>{["Product", "Spend", "Reason", "Customer email", "Created", "Status", ""].map((item, index) => <th key={`${item}-${index}`} className="px-4 py-3 font-bold">{item}</th>)}</tr></thead><tbody>{opportunities.map((item) => <tr key={item.id} className="border-t border-black/8"><td className="px-4 py-3 font-semibold">{item.leaving_product}{item.is_demo ? " · DEMO" : ""}</td><td className="px-4 py-3">${item.monthly_spend}/mo</td><td className="max-w-[260px] truncate px-4 py-3">{item.reason}</td><td className="px-4 py-3">{item.customer_email}</td><td className="px-4 py-3">{new Date(item.created_at).toLocaleString()}</td><td className="px-4 py-3">{item.status}</td><td className="px-4 py-3"><AdminHideButton type="opportunity" id={item.id} disabled={item.status === "hidden"} /></td></tr>)}</tbody></table></div>
          </section>

          <section className="mt-12"><h2 className="font-instrument-serif text-3xl">Offers <span className="text-lg text-[#77726a]">({offers.length})</span></h2>
            <div className="mt-4 overflow-x-auto rounded-[12px] border border-black/10 bg-white"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="bg-[#f2f0eb] text-[#68635b]"><tr>{["Provider", "URL", "Offer", "Provider email", "Payment", "Created", ""].map((item, index) => <th key={`${item}-${index}`} className="px-4 py-3 font-bold">{item}</th>)}</tr></thead><tbody>{offers.map((item) => <tr key={item.id} className="border-t border-black/8"><td className="px-4 py-3 font-semibold">{item.product_name}</td><td className="max-w-[180px] truncate px-4 py-3">{item.product_url}</td><td className="max-w-[260px] truncate px-4 py-3">{item.offer_text}</td><td className="px-4 py-3">{item.provider_email}</td><td className="px-4 py-3">{item.payment_status}</td><td className="px-4 py-3">{new Date(item.created_at).toLocaleString()}</td><td className="px-4 py-3"><AdminHideButton type="offer" id={item.id} disabled={item.is_hidden} /></td></tr>)}</tbody></table></div>
          </section>
        </div>
      </div>
    </main>
  )
}
