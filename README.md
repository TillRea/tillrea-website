# TillRea — Museum & Pameran Digital

Website utama [tillrea.my.id](https://tillrea.my.id) milik **Fikri Hikam A.** — mahasiswa Sistem Informasi UNISNU Jepara, Full-Stack Web & Data Analytics.

Konsepnya seperti museum: halaman utama adalah lobi, dan setiap website yang dibuat / di-hosting tampil sebagai ruang pameran di subdomain sendiri.

## Live

| Situs | URL |
|---|---|
| Lobi Museum (utama) | https://tillrea.my.id |
| Portofolio Fikri Hikam A. | https://portofolio.tillrea.my.id |
| Reny HikZar Collection — penjahit di Sinanggul, Mlonggo, Jepara | https://renyhikzar.tillrea.my.id |
| Situs Demo | https://demo.tillrea.my.id |
| Cpi (pameran tamu) | https://cpi.tillrea.my.id |

## Isi repo

- `main/` — lobi museum (HTML statis, desain terang modern), panel admin, dan halaman berkas
- `subdomains/` — satu folder per pameran/subdomain
- `museum.nginx.conf` — konfigurasi Nginx: domain utama + wildcard subdomain di port lokal 8080, diteruskan lewat Cloudflare Tunnel

## Teknologi

HTML, CSS, JavaScript, Nginx, Cloudflare Tunnel

## Terkait

- Source portofolio (React 19 + Vite 6 + Tailwind CSS v4): repo `portofolio-fikri-hikam`
- Profil: https://github.com/TillRea · https://www.linkedin.com/in/fikri-hikam-1a69ba40a
