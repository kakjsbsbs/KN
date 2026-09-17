# Test Credentials
# Agent writes here when creating/modifying auth credentials (admin accounts, test users).
# Testing agent reads this before auth tests. Fork/continuation agents read on startup.

Lingkungan lokal pengujian saja. Base URL API: baca REACT_APP_BACKEND_URL di /app/frontend/.env.
Konteks badan usaha uji: ent_ksc (header X-Entity-Id; pilih badan usaha yang sama di layar).

- Admin: admin@kainnusantara.id / demo12345
- MD (merchandiser): md@kainnusantara.id / demo12345
- Manajer: manager@kainnusantara.id / demo12345
- Sales: sales@kainnusantara.id / demo12345
- Admin Sales: salesadmin@kainnusantara.id / demo12345
- Admin Sampel: sampleadmin@kainnusantara.id / demo12345 (Yoga Admin Sampel, role sample_admin, beranda `sample-admin-desk`)
- Finance: finance@kainnusantara.id / demo12345
- Gudang: warehouse@kainnusantara.id / demo12345
- Desainer: designer@kainnusantara.id / demo12345 (Sari Melati, role designer, entitas ent_ksc)

DESIGN STUDIO (2026-09-16): layar `?view=rnd-designs&entity=ent_ksc` (hub Desainer → tab "Desain & Pattern"). Klik kartu `design-card-<id>` membuka halaman detail (`design-detail-page`). Kode desain otomatis (mis. BDI-PTR-SLR-001). Nilai versi 0–2 kelipatan 0,25; ambang ACC default 1,5 (`rnd.design_acc_min_score`). Aksi penilai (review/nilai/ACC/aktifkan/arsip) hanya admin/manager; desainer: buat, unggah, ajukan, versi baru, umpan balik, colorway.

Login UI testid: login-email-input, login-password-input, login-submit-button.
KPI DESAINER (2026-09-17): layar `?view=designer-kpi&entity=ent_ksc` (admin/manager). Tren nilai desain: testid `design-score-trend` (chart `design-score-trend-chart`, months `design-score-trend-months`). Bobot desain: setting `rnd.kpi_weight_design` (PUT /api/config/values, scope_type global). Data demo nilai desain: `cd /app/backend && python ../scripts/seed_design_scores_demo.py`.
MASTER PRODUK SHOWCASE (2026-09-17): `?view=md-products&entity=ent_ksc` → klik `catalog-open-ptpl_c3546aeb9702d12ec9fb` (Endek Bali Rangrang, 4 varian warna, 12 media disetujui: foto/detail/mockup/artwork). Testid: `catalog-family-hero`, `catalog-tab-variants|info|rnd`, `catalog-select-<product_id>`, `media-filter-<all|photo|detail|mockup|artwork>`, `media-item-<id>`, `catalog-relations`, `relations-artworks`. Seed ulang: `cd /app/backend && python ../scripts/seed_endek_showcase.py`.
Routing uji: ?view=md-products&entity=ent_ksc · ?view=rnd-specs&entity=ent_ksc · ?view=sales.
KNSelect: opsi <testid>-option-<value>, pencarian <testid>-search.
Gunakan prefix TEST_ untuk data baru; bersihkan hanya ID uji.
Jika akun md@ hilang setelah seed: `supervisorctl restart backend` (bootstrap idempoten).

FASE SL (scan label): tugas uji `wms_e2e3d9059660` (KSC/PO-00014, CBN-MEGA-PREM, 250 yard, wh_jakarta, bin A1-01).
CATATAN 2026-09-16: task PO-00014 (`wms_7d68b73ebcc1`) sudah DISELESAIKAN oleh main agent untuk data uji selisih → PO `po_78d343ce4efd` status completed dengan `receipt_variances[0]` (roll RL-00058 label≠aktual). Untuk scan label baru pakai task inbound lain yang masih `waiting_goods` (GET /api/inbound/tasks).
Peran `finance` demo TIDAK memegang `vendor_bill.view` (matriks izin lama) → uji Tagihan Supplier / billing-context dengan admin@ atau manager@.
Pola label per Barang Supplier: `sit_b5ed6c7e1bc9` (NTT-IKAT-GRD, Ntt Weaving) berpola GS1; task scan uji `wms_f808e668a2e7` (KSC/PO-00015, TNI-GRGD-001, 180 yard, status receiving) — contoh label GS1 `(240)NTT-IKAT-GRD(10)DL-G1(21)R1(3231)000300` (=30 yd), fallback supplier `NTT-IKAT-GRD|DL-G1|R2|30|5|BLU`. Selalu undo roll uji.
Contoh label: `{"sku":"CBN-MEGA-PREM","lot":"DL-01","roll":"R1","yd":120.5,"kg":25.1,"color":"RED"}` · `CBN-MEGA-PREM|DL-01|R2|118|24.5|RED` · `(240)CBN-MEGA-PREM(10)DL-01(21)R3(3230)00000120`.
Layar: login gudang → `wms-tab-inbound` → `inbound-task-<id>` → panel `scan-label-panel`. Reset demo: `bash scripts/seed_reset.sh`.


§3-C JUAL SAMPEL (2026-09-16, menu "Jual Sampel" DIHAPUS): sampel = baris SO ber-`is_sample` dari POS
(ProductQuickView `quickview-sample-button`, toggle `toggle-sample-<pid>`, harga manual `sample-price-input-<pid>`).
Confirm SO → tugas outbound `task_subtype=sample_cut`; gudang: WMS Barang Keluar → `sample-cut-panel-<taskId>`
(`sample-cut-code-` isi EPC/nomor roll, `sample-cut-length-`, `sample-cut-use-suggested-`) atau HP gudang tab Sampel.
API: GET /api/sample-quote · POST /api/outbound/tasks/{id}/cut-sample {epc|roll_id, actual_length, reason}.
Contoh EPC roll available ent_ksc: lihat rfid_tags (roll RL-00002 → E20B-639D-27E3-C84F-7696-157A).
Uji regresi: pytest backend/tests/test_sample_pos_flow.py. Master harga sampel: view pricelist (bawah).

REVISI SAMPEL (2026-09-17): Pesanan Sampel = SO ber-`order_type:"sample"`, nomor `KSC/SOS-00001` (sequence sendiri, terpisah dari SO-).
POS: ProductQuickView → `quickview-kind-regular` | `quickview-kind-sample` (wajib pilih; sampel qty default = maks: woven 5 yard, knit 2 kg; input di-clamp) → `quickview-sample-button`.
Keranjang satu jenis (banner `pos-cart-kind-banner`, tombol `floating-cart-button` coklat saat sampel). Checkout step 2: `sample-billing-free` | `sample-billing-paid` (wajib) → `checkout-submit`.
API: POST /api/sales-orders {order_type:"sample", sample_billing:"free|paid", items[...]} · GET /api/sample-orders · /desk · /stats/summary · POST /api/sample-orders/{id}/approve-payment (finance|sample_admin|manager|admin) · /confirm (sample_admin|manager|admin → tugas outbound sample_cut) · /cancel.
Server menolak: campur sampel+biasa (SAMPLE_MIXED 400), qty > batas (SAMPLE_LIMIT 400), confirm berbayar sebelum ACC (409 SAMPLE_PAYMENT_PENDING).
Layar: `?view=sample-orders` (testid sample-orders-view, sample-order-row-<id>, sample-detail-approve-payment/confirm/cancel) · `?view=sample-admin-desk` (sample-desk, antrean bayar_sampel/siap_gudang/di_gudang/kirim_ambil/selesai, baris pakai DeskQueueCard testPrefix sample-desk).
Gudang: WMS Barang Keluar → task subtype sample_cut (order_number SOS-) → POST /api/outbound/tasks/{id}/cut-sample {epc|roll_id, actual_length}.
Frontend TIDAK hot-reload: setelah edit src jalankan `bash /app/scripts/rebuild_frontend.sh` (log /app/.frontend_build.log).

REVISI SAMPEL (2026-09-17): Pesanan Sampel = SO ber-`order_type:"sample"`, nomor `KSC/SOS-00001` (sequence sendiri, terpisah dari SO-).
POS: ProductQuickView → `quickview-kind-regular` | `quickview-kind-sample` (wajib pilih; sampel qty default = maks: woven 5 yard, knit 2 kg; input di-clamp) → `quickview-sample-button`.
Keranjang satu jenis (banner `pos-cart-kind-banner`, tombol `floating-cart-button` coklat saat sampel). Checkout step 2: `sample-billing-free` | `sample-billing-paid` (wajib) → `checkout-submit`.
API: POST /api/sales-orders {order_type:"sample", sample_billing:"free|paid", items[...]} · GET /api/sample-orders · /desk · /stats/summary · POST /api/sample-orders/{id}/approve-payment (finance|sample_admin|manager|admin) · /confirm (sample_admin|manager|admin → tugas outbound sample_cut) · /cancel.
Server menolak: campur sampel+biasa (SAMPLE_MIXED 400), qty > batas (SAMPLE_LIMIT 400), confirm berbayar sebelum ACC (409 SAMPLE_PAYMENT_PENDING).
Layar: `?view=sample-orders` (testid sample-orders-view, sample-order-row-<id>, sample-detail-approve-payment/confirm/cancel) · `?view=sample-admin-desk` (sample-desk, antrean bayar_sampel/siap_gudang/di_gudang/kirim_ambil/selesai, baris pakai DeskQueueCard testPrefix sample-desk).
Gudang: WMS Barang Keluar → task subtype sample_cut (order_number SOS-) → POST /api/outbound/tasks/{id}/cut-sample {epc|roll_id, actual_length}.
Frontend TIDAK hot-reload: setelah edit src jalankan `bash /app/scripts/rebuild_frontend.sh` (log /app/.frontend_build.log).

REVISI DESIGNER (2026-09-17, catatan klien): Jenis desain & palet warna DIHAPUS dari form. Dua kategori: Kategori Pattern (SLR/BTK/BGA/PLD/ABS/CSMR) + Kategori Design (AO/PG), master di `design_categories` sumbu `pattern`|`design` (admin/manager tambah via `rnd-designs-categories`). Kode otomatis `{DESIGNER}-{CAT}-{DCAT}-{SEQ}` mis. SRI-SLR-AO-001.
Ronde: request-revision OTOMATIS buka versi baru (round_label "Revisi N", revision_count). Tahap final sesudah ACC: penilai set `final_color_count` (default 4) + `recommended_product_ids` di payload approve; desainer unggah files-kind `colorway` (≥N) + `mockup` (≥1) → POST lifecycle/submit-final → admin lifecycle/activate (hanya dari final_submitted); lifecycle/return-final (catatan wajib) mengembalikan ke approved.
Testid: form `design-title-input`, `design-category-select`, `design-dcategory-select`, `design-code-preview`, `design-form-save`; kartu `design-round-<id>`; detail `design-detail-round`, `design-rounds-progress`, `design-round-<v>`, `design-final-box`, tab `design-tab-final`, `design-final-panel`, `design-final-checklist`, upload `design-upload-colorway`/`design-upload-mockup`/`design-upload-artwork`; aksi `design-action-submit|start_review|request_revision|approve|submit_final|return_final|activate|archive`, dialog `design-action-dialog`, `design-action-note`, nilai `design-action-score-1_75` dst, ACC: `design-approve-products` + `design-approve-color-count`, `design-action-confirm`; peruntukan produk admin (setelah ACC) `design-detail-products-edit`.
Frontend TIDAK hot-reload: setelah edit src jalankan `setsid nohup bash /app/scripts/rebuild_frontend.sh > /app/.rebuild.out 2>&1 &` (background biasa mati saat tool call selesai).

RONDE REVISI SERAGAM (2026-09-17): Permintaan Desain `?view=design-requests&entity=ent_ksc` — badge `dsr-card-revision-<id>`, `dsr-row-revision-<id>`, detail `dsr-detail-revision` + `dsr-rounds-progress`/`dsr-round-<n>` (contoh KSC/DSR-00004 = dsr_a623af63e8e1 → Revisi ke-1). R&D `?view=rnd-samples&entity=ent_ksc` — `rnd-sample-revision-<id>`, detail `sample-detail-revision` (KSC/SMP-00003 → Revisi ke-1). Meja MD — `md-desk-revision-<ref_id>`; API GET /api/md/desk?entity_id=ent_ksc → rows.revision_count.
FILTER REVISI (2026-09-17): `dsr-revision-filter-<all|1|2|3>` di ?view=design-requests (API min_revision=N), `rnd-samples-revision-filter-<all|1|2|3>` di ?view=rnd-samples.
PELANGGAN (2026-09-17): `?view=customers-crm&entity=ent_ksc` → `customer-create-button` → modal seksi `customer-section-store|pic|sales`; sales@ melihat `customer-assigned-sales-self`, admin melihat select `customer-assigned-sales`. Wajib: customer-pic, customer-phone, customer-address. POS quick-add `create-customer-modal` catatan `new-customer-sales-note`.
