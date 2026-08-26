import { Header } from "@/components/marketplace/header"
import { OfferSuccess } from "@/components/marketplace/offer-success"

export const dynamic = "force-dynamic"

export default async function OfferSuccessPage({ searchParams }: { searchParams: Promise<{ offer_id?: string }> }) {
  const { offer_id: offerId } = await searchParams
  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#151412]">
      <div className="mx-auto min-h-screen max-w-[1120px] border-x border-black/10 bg-[#fbfaf7]">
        <Header back />
        <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-2xl items-center justify-center px-5 py-20">
          {offerId ? <OfferSuccess offerId={offerId} /> : <div className="text-center"><h1 className="font-instrument-serif text-5xl">Missing offer.</h1><p className="mt-4 text-[#68635b]">We couldn&apos;t identify the offer associated with this return.</p></div>}
        </section>
      </div>
    </main>
  )
}
