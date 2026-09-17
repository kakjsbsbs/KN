# PRD — Kain Nusantara ERP (repo makisjsbs/KN) · sesi 2026-09-16 · DESIGN STUDIO

## Problem statement (verbatim)
saya ingin anda lanjutkan development dari repo ini https://github.com/makisjsbs/KN
saya ingin anda lanjutkan development fokus pada desaigner, untuk saat ini fitur ini masih sangat basic. beberapa point yang ingin saya kembangkan
1. ketika membuat design baru. kode otomatis dan bisa dikonfigurasi bukan input custom
2. tambahkan kolom category motif/category pattern/ category artwork sesua dengan jenis design yang dipilih
3. design ini sebenarnya adalah pattern yang bisa di implementasikan untuk product, 1 design bisa lebih dari 1 product ... optional (rekomendasi/peruntukan)
4. tambahkan referensi foto yang bisa ditambahkan oleh yang membuat design.
5. tag jangan hanya custom value namun tersimpan juga jadi nextnya bisa diketik sedikit dan langung bisa pilih
6. filter lengkap
7. bisa melihat detail history design beserta dengan versi versinya dan timelinenya juga, catatan & kenapa belum acc, feedback dua arah designer ↔ penilai
8. mekanisme penilaian: skala 0 - 2 kelipatan 0,25
9. setiap artwork setiap versinya diberikan nilai oleh penilai dengan nilai final acc
10. lifecycle design yang baik, tahapan jelas, nanti bisa ditambahkan referensi mockup
11. setiap design punya alternative design (kombinasi warna berbeda)
12. warna harus sesuai master (kode warna benar), tidak bisa asal

## Keputusan pemilik (ask_human)
- Kode: `{DESIGNER}-{TYPE}-{CAT}-{SEQ}` → mis. `BDI-PTR-SLR-001` (inisial desainer · jenis · kategori · urut), pola & prefix bisa diubah di Pusat Pengaturan (grup R&D).
- Foto referensi/mockup: storage LOKAL dulu (storage_service), migrasi object storage nanti.
- Lifecycle disetujui: Draf → Diajukan → Dalam Review → Perlu Revisi (versi baru) → Disetujui (ACC) → Aktif/Produksi → Diarsipkan; halaman detail khusus.
- Nilai: SATU nilai total per versi + catatan; ambang ACC default 1,5 (konfigurasi `rnd.design_acc_min_score`).
- Warna: pakai master `color_library` yang sudah ada.

## Arsitektur yang diimplementasikan (2026-09-16)
Backend (menumpang koleksi `design_gallery`, bukan koleksi baru):
- `services/design_studio_service.py` — kategori (`design_categories`, seed 17 default), kode otomatis (`next_code`, `designer_prefix`), tag tersimpan (`design_tags`), `resolve_colors` (wajib color_library aktif), `resolve_products`, lifecycle `transition()` + `timeline[]`, `score_version()` (0–2 step 0,25, riwayat), `add_feedback()` (side designer/assessor + notifikasi), `new_version()`, colorway CRUD, `enrich()`.
- `routers/design_studio.py` — `/api/design-studio/{meta,next-code,tags,categories}`, `/api/design-gallery/{id}/lifecycle/{submit|start-review|request-revision|approve|activate|archive|reopen}`, `/new-version`, `/versions/{v}/score`, `/feedback`, `/colorways[/{cw}]`, `/files-kind/{artwork|reference|mockup}`.
- `config_catalog_rnd.py` — `rnd.design_code_pattern`, `rnd.design_code_seq_digits`, `rnd.design_prefix_{motif,pattern,artwork}`, `rnd.design_acc_min_score`.
- `design_gallery_service.py` — create (kode otomatis, kategori, warna, produk, timeline), list filter (status/type/category/created_by/product/color), `add_file(kind, version, caption)`; `is_artwork` = kind artwork saja.
- RBAC: lihat rnd.view|hr.view; tulis rnd.manage|hr.manage_attendance|design_request.deliver (designer); menilai rnd.assess (admin/manager).

Frontend (`features/rnd/`):
- `RndDesignsView.jsx` — kartu + KPI + filter lengkap (status, jenis, kategori, desainer, tag, produk, warna, nilai, artwork, lini, cari); klik kartu → halaman detail.
- `DesignFormModal.jsx` — kode preview otomatis (read-only), kategori mengikuti jenis, `ColorPicker` (master), `ProductPicker` (opsional multi), `TagInput` (autocomplete tersimpan), kelola kategori.
- `design/DesignDetailPage.jsx` — stepper lifecycle, `LifecycleActions` (aksi sesuai status & peran, dialog nilai+catatan), tab Ringkasan · Versi & Nilai (`VersionsPanel`, `ScoreInput`) · Timeline · Umpan Balik (`FeedbackThread`) · Warna & Alternatif (`ColorwaysPanel`) · Referensi & Mockup (`FilesPanel`).
- hubTabs: tab "Desain & Pattern" kini terbuka untuk peran `designer`.
- Catatan: frontend disajikan dari bundle statis → `bash scripts/rebuild_frontend.sh` setelah ubah src.

## Uji
- Testing agent iteration_19: 12/12 backend PASS, UI admin & designer PASS (test_reports/iteration_19.json).

## 2026-09-16 (lanjutan) — KPI Desainer × Design Studio
- `rnd_kpi_service.design_studio_stats()` mengagregasi `design_gallery` per desainer (created_by) per periode: `designs`, `design_versions`, `design_scored`, `design_avg_score` (0–2), `design_acc`, `design_acc_rate`, `design_revisions` (event `request_revision`). Digabung ke baris `designer_kpi` (desainer yang hanya punya desain ikut muncul, grade tetap dari round sample), ringkasan (`summary.design_*`), ekspor CSV/Excel/PDF (4 kolom baru), rapor per-desainer (4 metrik baru), dan KPI Saya.
- UI: `DesignerKpiTable` +4 kolom (Versi desain · Nilai desain /2 · ACC desain · Revisi desain); `DesignerKpiView` +2 kartu ringkasan (testid `designer-kpi-summary-design-score`, `designer-kpi-summary-design-revisions`).
- Belum: nilai desain belum masuk bobot grade komposit (masih terpisah, skala berbeda); tren bulanan belum memuat nilai desain. → SELESAI 2026-09-17 (lihat bawah).

## 2026-09-17 — Tren Nilai Desain + Bobot Nilai Desain ke grade komposit
- Setting baru `rnd.kpi_weight_design` (pct, default 20, grup R&D, Pusat Pengaturan) → `rnd_gate.policy` → `rnd_kpi_service.weights()["design"]`.
- `compute_grade`: komponen ke-4 = `design_avg_score × 50` (0–2 → 0–100), dinormalkan bersama on_time/score/acc; keluaran baru `grade_design_pts`. `designer_kpi` menggabungkan statistik Design Studio SEBELUM grade dihitung (desainer yang hanya punya desain kini ikut ter-grade). Rumus di "Cara nilai dihitung" (UI), ekspor PDF/Excel (`formula_of`) dan tooltip tabel menyebut bobot desain.
- Tren: `GET /rnd/reports/designer-kpi/trend?metric=design_score` → `design_score_trend()` (rata nilai versi desain per desainer per bulan; tanggal = `score_at` fallback `at`; hanya desainer yang punya nilai). Tren `metric=grade` juga ikut memasukkan nilai desain bulan itu.
- UI `DesignerKpiView`: baris `designer-kpi-trend-row` (grid 2 kolom xl) = `DesignerKpiTrendChart` (kiri) + `DesignScoreTrendChart` (kanan, testid `design-score-trend`, Y 0–2, garis ambang ACC 1,5). Tautan `designer-kpi-design-weight-link` membuka setting bobot desain.
- Demo data: `python scripts/seed_design_scores_demo.py` (dari /app/backend) menambah versi desain bernilai 3 bulan ke belakang untuk Dewi Lestari, Desainer Demo, Bagas Nugroho.

## 2026-09-17 — Visual Master Produk (Produk & Varian) + showcase Endek Bali Rangrang
- `features/catalog/`: `FamilyHero.jsx` (foto utama + 6 fakta kunci + deskripsi + swatch warna), `VariantCard.jsx` (kartu varian bergambar: thumbnail cover, titik warna, harga, lifecycle, stok, ringkas foto/mockup/artwork), `FamilyInfoTab.jsx` (4 kartu: deskripsi · spesifikasi teknis 2 kolom · kain dasar · atribut varian sebagai chip), `ProductRelations.jsx` (2 kartu: spesifikasi R&D + asal desain & artwork strip), `VariantMedia.jsx` (galeri grid tile dengan filter jenis Semua/Foto/Detail/Mockup/Artwork, badge jenis, ikon foto utama). Tab ber-count, CSS baru di `catalog.css` (hero, variant-card, info-card, media-grid, responsif 390px).
- Backend TIDAK berubah (visual saja, sesuai keputusan pemilik).
- Showcase: `scripts/seed_endek_showcase.py` — induk ENK-BALI-003 diberi axis Warna (4 opsi dari color_library), 3 varian baru (Merah Marun, Kuning Emas, Hitam Pekat), 12 media stok foto lokal (`scripts/demo_media/*.jpg`, Unsplash) jenis photo/detail/mockup/artwork, semua disetujui + cover.

## 2026-09-17 — Bugfix: preview blank setelah rebuild (service worker basi)
- Akar masalah: `public/sw.js` cache-first untuk `/` & `/index.html` → index lama merujuk chunk ber-hash yang sudah hilang; `static_server.js` mengembalikan index.html (SPA fallback) untuk `/static/js/*` yang hilang → JS gagal parse → halaman putih.
- Fix: SW `kn-sw-v2` — navigasi/index network-first (fallback cache hanya saat offline), aset `/static` tetap cache-first; cache `kn-sw-v1-*` dihapus saat activate. `static_server.js`: 404 untuk aset ber-hash yang hilang, `Cache-Control: no-store` untuk html/sw.js. `index.js`: `reg.update()` saat load + auto-reload sekali (bersihkan cache) bila script `/static/js` gagal dimuat.
- Catatan operasional: `static_server.js` berubah → perlu `sudo supervisorctl restart frontend` sekali (sudah dilakukan). Rebuild berikutnya cukup `bash scripts/rebuild_frontend.sh`.

## 2026-09-17 — Lanjutan dari repo GitHub (makajajbd/KN) + REVISI DESIGNER (catatan klien 17 Sep)
- Titik berhenti sesi lalu (Pesanan Sampel SOS) DIUJI testing agent: backend 14/14 lulus, POS sampel, meja Admin Sampel, daftar SOS OK (`test_reports/iteration_23.json`).
- Interpretasi & implementasi catatan klien Designer:
  1. Jenis desain (motif/pattern/artwork) & palet warna DIHAPUS dari form; field lama tetap opsional di skema (kompatibel data lawas).
  2. Dua kategori: **Kategori Pattern** (SLR Salur, BTK Batik, BGA Bunga, PLD Polkadot, ABS Abstrak, CSMR Cashmere) → **Kategori Design** (AO Allover, PG Pinggiran). Master `design_categories` sumbu `pattern|design`; admin/manager menambah pilihan sendiri via modal Kategori (`rnd-designs-categories`). Sumbu lama motif/artwork dinonaktifkan otomatis (migrasi idempoten).
  3. Kode otomatis `{DESIGNER}-{CAT}-{DCAT}-{SEQ}` → mis. `SRI-SLR-AO-001` (placeholder `{DCAT}` baru, `{TYPE}` masih dikenali).
  4. Peruntukan produk dipindah ke dialog **ACC** (penilai memilih produk + jumlah varian warna final, default 4); bisa diubah admin setelah ACC (`design-detail-products-edit`). Desainer tidak melihat field ini.
  5. Notifikasi ke admin/manager saat desainer Ajukan: judul menyebut ronde ("Pengajuan awal"/"Revisi N") dan jumlah berkas.
  6. **Ronde revisi otomatis**: `request-revision` langsung membuka versi baru; desainer cukup unggah 1–N berkas lalu Ajukan lagi. `new-version` manual saat status revisi ditolak. Setiap berkas artwork tercatat rondenya.
  7. UI progres: badge `Revisi ke-N` di kartu (`design-round-<id>`) & detail (`design-detail-round`), kotak progres per ronde (`design-rounds-progress`, `design-round-<v>`: jumlah berkas, nilai, hasil Direvisi/ACC/Review) + kotak Final.
  8. Tahap **Final** sesudah ACC (status baru `final_submitted`): desainer wajib unggah `colorway` ≥ N + `mockup` ≥ 1 → `lifecycle/submit-final`; admin `activate` hanya dari `final_submitted`; `return-final` (catatan wajib) mengembalikan ke ACC. Tab "Final: Warna & Mockup" menggantikan tab palet/colorway.
- Bugfix: konflik Mongo `$set`+`$push` pada `versions` saat request-revision (500) → versi baru di-append ke list.
- Operasional: frontend static build; rebuild harus `setsid nohup bash scripts/rebuild_frontend.sh > .rebuild.out 2>&1 &` (proses background biasa mati saat tool call selesai).
- Belum: indikator ronde revisi untuk R&D/MD di luar Design Studio (klien minta "berlaku ke seluruhnya") — R&D sample sudah punya konsep `round`, tapi belum ada badge/kotak progres seragam.


## 2026-09-17 — Lanjutan repo GitHub (agadatavasala/kn): indikator ronde revisi SERAGAM selesai (P1)
- Komponen bersama `components/RevisionProgress.jsx`: `RevisionBadge` ("Pengajuan awal" / "Revisi ke-N"), `RoundBoxes`, `sampleRevisionCount`, `designRequestRounds` (ronde Permintaan Desain dibangun dari `history`: delivered → buka ronde; revision/approved/cancelled menutup).
- R&D Sample: badge di header detail (`sample-detail-revision`, warisan sesi lalu) + baris daftar (`rnd-sample-revision-<id>`); kotak progres per supplier×jenis (`sample-rounds-progress-*`).
- Permintaan Desain (MD): badge kartu papan (`dsr-card-revision-<id>`), kolom "Ronde" di tabel (`dsr-row-revision-<id>`), panel detail (`dsr-detail-revision`, `dsr-rounds-progress`, `dsr-round-<n>`).
- Meja MD: `work_desk_service.md_desk()` mengirim `revision_count` pada baris design_request & md_sample; `DeskQueueCard.QueueRow` menampilkan badge (`md-desk-revision-<ref_id>`) hanya bila field ada.
- Lingkungan: backend/.env CORS_ORIGINS eksplisit (wajib, backend menolak "*"); `.restore_env.sh` pip+yarn+seed; frontend static build → `setsid nohup bash scripts/rebuild_frontend.sh > .rebuild.out 2>&1 &`.
- Uji: testing agent iterasi 24 — backend 4/4, frontend e2e semua lulus, nol regresi (`test_reports/iteration_24.json`).

## 2026-09-17 — Penyaring "Revisi ≥ N" (Permintaan Desain & R&D Sample)
- `RevisionFilter` bersama di `components/RevisionProgress.jsx` (chip Semua ronde / Revisi ≥ 1 / ≥ 2 / ≥ 3).
- Permintaan Desain: server-side `GET /api/design-requests?min_revision=N` (`revision_count $gte`, ge=0 → 422 bila negatif); KPI ringkasan ikut tersaring; testid `dsr-revision-filter-<all|1|2|3>`; empty state khusus.
- R&D Sample: saring klien `sampleRevisionCount(r) >= N`; testid `rnd-samples-revision-filter-<all|1|2|3>`; berkombinasi dengan pencarian & chip jenis.
- Uji: testing agent iterasi 25 — backend 5/5, frontend e2e lulus (`test_reports/iteration_25.json`).

## 2026-09-17 — REVISI KLIEN 17 Sep: Master data pelanggan (PIC toko vs Sales penanggung jawab)
- Istilah dibedakan di seluruh UI: **Sales Penanggung Jawab (internal KN)** = `assigned_sales_id`; **PIC Toko (pihak pelanggan)** = `pic_name` + `phone`. Tim sales: label "(Penanggung jawab)"; Customer 360: "Sales penanggung jawab tunggal".
- Wajib (server `POST /api/customers` + klien): nama PIC toko, No. HP/WA PIC toko, alamat toko (nilai "-" ditolak, ≥3 karakter).
- Role `sales` → penanggung jawab OTOMATIS akun sendiri (payload assigned_sales_id diabaikan); role lain wajib memilih sales (400 bila kosong dan tidak ada PIC di sales_team).
- Form pelanggan (`CustomerFormModal`) disusun 3 seksi (`customer-section-store|pic|sales`); sales melihat kotak `customer-assigned-sales-self`. POS quick-add (`CreateCustomerModal`) label diperjelas + catatan `new-customer-sales-note`.
- Segment: teks bantuan "Klasifikasi untuk laporan BI & analitik penjualan — tidak mengubah harga".
- Uji: testing agent iterasi 26 — backend 8/8, frontend lulus (`test_reports/iteration_26.json`).

## Backlog / P1–P2
- P1: Migrasi berkas desain ke Emergent Object Storage.
- P1: Tautkan colorway → labdip/proofing (permintaan sample per colorway).
- P2: Mockup AI per colorway (gemini_image_service sudah ada di galeri).
- P2: KPI desainer ikut membaca nilai versi desain (saat ini KPI dari round sample).
- P2: Field `designer_code` per user (override inisial otomatis) di Pengaturan Akun.
- P2: Filter server-side + paginasi bila desain > 2000.
