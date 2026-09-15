import Link from "next/link";
import { PrimaryButton, GhostButton } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[radial-gradient(120%_80%_at_50%_-10%,oklch(0.92_0.04_170),oklch(1_0_0)_55%)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-24 mx-auto h-64 w-[120%] max-w-none opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 40%, oklch(0.7 0.08 170 / 0.35), transparent 40%), radial-gradient(circle at 80% 30%, oklch(0.7 0.1 35 / 0.25), transparent 35%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-2xl font-extrabold tracking-tight text-primary">Trato</p>
        <Link
          href="/login"
          className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </header>

      <section className="relative z-10 flex flex-1 flex-col justify-end px-5 pb-8 pt-16">
        <p className="mb-3 text-sm font-semibold text-primary">Banda justa · deal corto</p>
        <h1 className="max-w-[14ch] text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-ink text-balance">
          El viaje se acuerda, no se impone.
        </h1>
        <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-muted text-pretty">
          Ves el rango justo, ofreces tu precio, el conductor responde con ETA.
          Sin surge opaco ni pelea eterna de bids.
        </p>

        <div className="mt-8 space-y-3">
          <Link href="/signup?role=passenger" className="block">
            <PrimaryButton type="button">Quiero viajar</PrimaryButton>
          </Link>
          <Link href="/signup?role=driver" className="block">
            <GhostButton type="button" className="w-full">
              Soy conductor
            </GhostButton>
          </Link>
        </div>

        <ul className="mt-8 grid gap-3 text-sm text-ink">
          <li className="rounded-2xl border border-line bg-surface/80 px-4 py-3">
            <strong className="font-bold">Fair band</strong>
            <span className="text-muted"> — min, sugerido y máximo siempre visibles.</span>
          </li>
          <li className="rounded-2xl border border-line bg-surface/80 px-4 py-3">
            <strong className="font-bold">Confianza</strong>
            <span className="text-muted"> — score, viajes y placa antes de aceptar.</span>
          </li>
          <li className="rounded-2xl border border-line bg-surface/80 px-4 py-3">
            <strong className="font-bold">Compartir viaje</strong>
            <span className="text-muted"> — link en vivo para quien esperas en casa.</span>
          </li>
        </ul>
      </section>
    </main>
  );
}
