import Link from "next/link";
import { BookOpen, CheckCircle2, Copy, FileCode2, HelpCircle, Info, ListOrdered } from "lucide-react";

export default function TutorialPage() {
  return (
    <main>
      <header className="sticky top-0 z-10 border-b border-edge bg-surface px-6 py-3 shadow-sm">
        <div className="flex flex-wrap gap-2.5">
          <Link href="/preview" className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-500 transition hover:bg-brand-500 hover:text-white">
            <Info size={15} /> Kembali ke Data
          </Link>
          <Link href="/validity" className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-500 transition hover:bg-brand-500 hover:text-white">
            <CheckCircle2 size={15} /> Uji Validitas
          </Link>
          <Link href="/reliability" className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-500 transition hover:bg-brand-500 hover:text-white">
            <ListOrdered size={15} /> Uji Reliabilitas
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[900px] px-5 pb-16 pt-8">
        <div className="mb-6 flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
            <BookOpen size={24} className="text-brand-500" />
          </div>
          <h1 className="text-[1.45rem] font-extrabold">Tutorial Copy Rumus LaTeX ke Microsoft Word</h1>
        </div>

        <section className="mb-5 rounded-2xl border border-edge bg-surface p-6 shadow-sm">
          <h2 className="mb-3.5 flex items-center gap-2 text-lg font-bold text-brand-500">
            <HelpCircle size={18} /> Mengapa Fitur Ini Dibuat?
          </h2>
          <p className="mb-3 leading-relaxed">
            Aplikasi ini menyediakan tombol <strong>Copy LaTeX</strong> agar rumus hasil
            perhitungan dapat langsung dipindahkan ke Microsoft Word tanpa perlu diketik ulang.
          </p>
          <p className="leading-relaxed">
            Rumus yang ditempel melalui fitur Equation Word akan tampil rapi dan profesional,
            sehingga cocok digunakan untuk skripsi, tesis, artikel ilmiah, maupun laporan penelitian.
          </p>
        </section>

        <section className="mb-5 rounded-2xl border border-edge bg-surface p-6 shadow-sm">
          <h2 className="mb-3.5 flex items-center gap-2 text-lg font-bold text-brand-500">
            <ListOrdered size={18} /> Langkah-Langkah
          </h2>
          <ol className="list-none space-y-4 pl-11">
            {[
              <>Pada halaman hasil analisis, klik tombol <strong>Copy LaTeX</strong>.</>,
              <>Buka dokumen Microsoft Word.</>,
              <>
                Tekan kombinasi tombol: <strong>Alt + =</strong> untuk membuat equation.
                <div className="mt-3 rounded-lg border border-[#c7c7e8] bg-brand-50 p-3.5 text-[0.92rem] text-[#3a3590]">
                  Pada sebagian versi Word, menu Equation dapat ditemukan melalui:{" "}
                  <strong>Insert → Equation</strong>.
                </div>
              </>,
              <>Word akan menampilkan kotak Equation.</>,
              <>Klik pada area Equation tersebut.</>,
              <>
                Pada tab <strong>Equation</strong>, ubah mode input menjadi{" "}
                <strong>LaTeX</strong> apabila belum aktif.
              </>,
              <>Tempel (Ctrl + V) rumus yang telah disalin dari aplikasi ini.</>,
              <>Tekan <strong>Spasi</strong> atau <strong>Enter</strong>.</>,
              <>Word akan mengubah kode LaTeX menjadi rumus matematika yang rapi secara otomatis.</>,
            ].map((step, i) => (
              <li key={i} className="relative leading-relaxed">
                <span className="absolute -left-11 top-0 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-500">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-5 rounded-2xl border border-edge bg-surface p-6 shadow-sm">
          <h2 className="mb-3.5 flex items-center gap-2 text-lg font-bold text-brand-500">
            <FileCode2 size={18} /> Contoh
          </h2>
          <p className="mb-3">Misalnya Anda menyalin rumus berikut:</p>
          <div className="overflow-x-auto rounded-xl bg-[#f8f8fc] p-4 font-mono text-sm">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-soft">Kode LaTeX</span>
            {String.raw`r_{xy}=\frac{n\sum xy-(\sum x)(\sum y)}{\sqrt{[n\sum x^2-(\sum x)^2][n\sum y^2-(\sum y)^2]}}`}
          </div>
          <p className="mt-3">
            Setelah ditempel ke Equation Word dan dikonversi ke format LaTeX, rumus akan
            tampil dalam bentuk matematika yang rapi.
          </p>
        </section>

        <section className="rounded-2xl border border-edge bg-surface p-6 shadow-sm">
          <h2 className="mb-3.5 flex items-center gap-2 text-lg font-bold text-brand-500">
            <Info size={18} /> Jika Rumus Tidak Berubah
          </h2>
          <ul className="mb-4 list-disc space-y-2 pl-5">
            <li>Pastikan Anda menggunakan Microsoft Word versi yang mendukung Equation.</li>
            <li>Pastikan rumus ditempel di dalam kotak Equation, bukan pada paragraf biasa.</li>
            <li>Pastikan mode Equation menggunakan format <strong>LaTeX</strong>.</li>
            <li>Coba tekan Spasi atau Enter setelah menempelkan rumus.</li>
          </ul>
          <div className="mb-3 rounded-lg border border-[#c7c7e8] bg-brand-50 p-3.5 text-[0.92rem] text-[#3a3590]">
            Pada sebagian versi Word, menu Equation dapat ditemukan melalui:{" "}
            <strong>Insert → Equation</strong>.
          </div>
          <div className="rounded-lg border border-[#bfe5cb] bg-[#f0faf4] p-3.5 text-[0.92rem] text-[#155c2e]">
            Seluruh rumus yang disediakan oleh aplikasi ini telah dibuat agar kompatibel
            dengan fitur Equation LaTeX pada Microsoft Word.
          </div>
        </section>
      </div>
    </main>
  );
}
