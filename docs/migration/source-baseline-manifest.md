# Phoenix AI — Source Baseline Manifest

> **Purpose:** Immutable, cryptographic record of the Phoenix AI source imported from Abacus.AI,
> captured **before** any Azure port work begins. This manifest lets us prove, at any later point,
> that the Azure application reuses the **exact original assets** — most importantly the Phoenix AI
> logo — with no optimisation, resize, recolour, or overwrite.
>
> **Baseline commit:** this document is committed together with the git tag
> **`abacus-source-baseline`**. Port work continues on branch **`migration/azure-port`**.
> **Hash algorithm:** SHA-256. **Sizes:** bytes. **Scope:** all git-tracked files (162).

---

## Logo integrity anchor (do not modify)

The original Phoenix AI logo is the single most important asset to preserve. Its checksum is
recorded here as the canonical reference for all future verification:

| Asset | Path | Size (bytes) | SHA-256 |
| --- | --- | --- | --- |
| **Phoenix AI logo** | `nextjs_space/public/logo.png` | 346691 | `dfb40a3ef32007ceef3c06f11a48d6b1794178d240d74e716f34e6f4917d8241` |

**SHA-256 (`public/logo.png`): `dfb40a3ef32007ceef3c06f11a48d6b1794178d240d74e716f34e6f4917d8241`**

Corroboration: the original upload `Uploads/6ed27144-5d62-4d6d-8f21-9dee746b7669.png` has the
**identical** size (346691 bytes) and SHA-256, confirming `logo.png` is the unaltered source asset.

> **Rule:** Do **not** optimise, resize, recolour, re-encode, or overwrite `public/logo.png`.
> Any future build must serve a `logo.png` whose SHA-256 matches the value above.

### How to verify later (PowerShell)
```powershell
(Get-FileHash -Algorithm SHA256 nextjs_space/public/logo.png).Hash.ToLower()
# Expected: dfb40a3ef32007ceef3c06f11a48d6b1794178d240d74e716f34e6f4917d8241
```

---

## Critical preserved assets

Checksums for the branding, PWA, TBSA, and design-system files that must survive the migration
byte-for-byte:

| Path | Size (bytes) | SHA-256 | Asset type |
| --- | --- | --- | --- |
| `nextjs_space/public/logo.png` | 346691 | `dfb40a3ef32007ceef3c06f11a48d6b1794178d240d74e716f34e6f4917d8241` | Image (PNG) |
| `nextjs_space/public/kkm-hkl-logo.jpeg` | 14537 | `4e6055437ed29f89e69e07abba2410df031befd41e638eb4d36626f914699a4f` | Image (JPEG) |
| `nextjs_space/public/favicon.svg` | 972 | `99ba479faab8480de41d876bcc800f89265aa02d7c15baa79edf6116b94d2108` | Image (SVG) |
| `nextjs_space/public/og-image.png` | 48620 | `ec654a534a071d4b5580f8e9e1f711f0b64b7b924d09350374e73f59beb24ab5` | Image (PNG) |
| `nextjs_space/public/icons/icon-72.png` | 4504 | `4a9b0782d7752da1f4d422846ef71427bbc672a6cdda82b5cbaecb32fc5156d0` | Image (PNG) |
| `nextjs_space/public/icons/icon-96.png` | 6780 | `47b9bb564d3b9fdecbd149f3565ba93fff9569d8e9bf88b2f2c728ea69593361` | Image (PNG) |
| `nextjs_space/public/icons/icon-128.png` | 10183 | `964fd02a34e54aeff25c04bdbdf0b7122a2ad75799cb718c13ad3188a95197e1` | Image (PNG) |
| `nextjs_space/public/icons/icon-144.png` | 12026 | `6c072cf55bed29ad68d37d442c888db25591cbdc5cc57cd21513045db8c2ee32` | Image (PNG) |
| `nextjs_space/public/icons/icon-152.png` | 12988 | `5314e46e60a05c6f449c7782a6b9ee1b1728bb5898e9e9a0a0656ba2d00722ec` | Image (PNG) |
| `nextjs_space/public/icons/icon-192.png` | 18192 | `65beda3ace5671aaa729ec3cbfbe44a6c5b093c823b325d9bb0868f0c50237e3` | Image (PNG) |
| `nextjs_space/public/icons/icon-384.png` | 52525 | `06dd6b49a4a513d525bbec90211c74ea202edcaceb437de87c20cca254ac5446` | Image (PNG) |
| `nextjs_space/public/icons/icon-512.png` | 85161 | `3e7d1213b31946da55829958eefd39bbf39080274a073203a0376eb23866216a` | Image (PNG) |
| `nextjs_space/public/icons/apple-touch-icon.png` | 16528 | `733275ecb4abacff51ceafdefe554665a2b914b1f50791593d666f0520cfe31e` | Image (PNG) |
| `nextjs_space/public/tbsa-anterior.png` | 7302 | `8e8852ff88456b7962180ac7077df4cce083a61dabf28b6b0da7c7f573ac23d5` | Image (PNG) |
| `nextjs_space/public/tbsa-posterior.png` | 7370 | `36cd130e3bd505e5e0614cf43f4e0acffafcdac0a03a4197d8f0a833ad7a18ab` | Image (PNG) |
| `nextjs_space/public/tbsa-anterior-mask.png` | 5825 | `c508a9f59ed5a67964250549313ffc8c4262702855d6d997cc284fd5a346f272` | Image (PNG) |
| `nextjs_space/public/tbsa-posterior-mask.png` | 6021 | `4cfedd1d9e758a99bb2941803cfd13ebfe31f096ad4dca0cd34e88f3a15be2df` | Image (PNG) |
| `nextjs_space/app/globals.css` | 3822 | `094f995cd47b9a72f19d0f767a2e8cfce5842e37e3f873db017f3441c17cae85` | Stylesheet |
| `nextjs_space/tailwind.config.ts` | 3482 | `4cd026e8fb55155ec4a33f667603e42d20c3938003eeb9ab37a729f7ea400d41` | TypeScript |
| `nextjs_space/STYLE_GUIDE.md` | 9059 | `eb979ab7389382e176f65fd18db8420a190164092e6d264b09f1162dad0a2303` | Markdown |

---

## Full manifest (all tracked files)

- **Total files:** 162
- **Total size:** 12,523,775 bytes (~11.9 MiB)
- **Generated:** 2026-08-06 from the working tree at the baseline commit.

> **Scope note:** The immutability guarantee applies to the **imported source** — application
> code under `nextjs_space/` and all binary assets (logos, icons, TBSA images, `og-image.png`,
> `favicon.svg`). Migration bookkeeping files (`docs/migration/MIGRATION.md`, `CHANGELOG.md`,
> and this manifest itself) are updated as part of this same commit, so their recorded hashes
> reflect their state at manifest-generation time and may differ from the committed versions.
> These files are intentionally mutable and are **not** part of the fidelity guarantee.

| Path | Size (bytes) | SHA-256 | Asset type |
| --- | --- | --- | --- |
| `.editorconfig` | 458 | `893038fc24a052a644dd63fb11501bdbe3ed6c99ac7454fd72fb3ee7fc241d54` | Other (.editorconfig) |
| `.env.example` | 1713 | `d6d816500c631e7a644b107b528401dea1dad95d2215b70cd534684aee2ee272` | Env example |
| `.github/copilot-instructions.md` | 3053 | `26f8f282bcc2e4a6b23a0239df70009af07ec3acd2e77cd3f72a97ac45fd93d4` | Markdown |
| `.github/workflows/ci.yml` | 1130 | `c02e25eb22c147ff5b417983af3f2af6633d987cae56bdab704e1847759132fa` | YAML |
| `.gitignore` | 738 | `96c214b136c0583036eed84650082c61761b77c144f84fced5db1691fa9bc668` | Other (.gitignore) |
| `.nvmrc` | 4 | `12d3a4efa6646b3ece4782f70033b9785bf0d167b553c43e22579b031cea5c4d` | Config |
| `CHANGELOG.md` | 1801 | `26dbee334d71fe7919c4b2a27d1aab8579bf3dc3ba6289602e9389c7cb580db4` | Markdown |
| `CONTRIBUTING.md` | 3659 | `d40deafc155fd950016df9644367e3f87062abd4cd27a93278f4b4e879cc3987` | Markdown |
| `docs/architecture/ARCHITECTURE.md` | 3533 | `9a0e7f74b5e53984cf22158df21037542699d31fff0df0a6f5b3af6630cc3c2b` | Markdown |
| `docs/migration/MIGRATION.md` | 7604 | `85bf89a8f1d8b82904f44094722d0209667865768a2d5be1b3ed5646aeba33e6` | Markdown |
| `docs/migration/source-code-audit.md` | 19993 | `0548a236866cf41a7732fa625dabfeade5b39fa13cd330b92bb6dfba46989bad` | Markdown |
| `docs/testing/TEST-STRATEGY.md` | 2825 | `c344f2d606835cc8fb614f133744442f35f6eaeb8de5d6266cc24a12fa897540` | Markdown |
| `nextjs_space/app/_components/landing-client.tsx` | 9390 | `cac79cd563ebc017b2440ffd3e52c2c56305962ccdca4d56e7b79b079af5923c` | React (TSX) |
| `nextjs_space/app/api/analyze-wound/route.ts` | 10876 | `fddd23afbc523f0643b73312d3abe3723fbb86782e717fc7b583a9fb68fc1076` | TypeScript |
| `nextjs_space/app/api/community-analyze/route.ts` | 5126 | `ebca92ab2b53b8b99c825d732aae2b1a708c4b183925452c33eef2a1d198d432` | TypeScript |
| `nextjs_space/app/api/community-chat/route.ts` | 2982 | `051b802263b5abd99e2d9c35b7f7dcabb2a1fef42fe6a619fdee75ca2762f14f` | TypeScript |
| `nextjs_space/app/api/hcp-chat/route.ts` | 3367 | `59942b8275d98a6a44f08a7cad11a98fb0110677590dbe81ed8edc767816ea9e` | TypeScript |
| `nextjs_space/app/community/_components/community-home-client.tsx` | 4740 | `71220f6f85cc754d24c7a106a754094e4516b8f413b85464900172fcaa537f73` | React (TSX) |
| `nextjs_space/app/community/_components/community-layout-client.tsx` | 6715 | `e0f3aa47b64b7cea1d95b2ee09cd6790d3b86c5ed87a67ac97260342cb39dcd3` | React (TSX) |
| `nextjs_space/app/community/articles/_components/articles-client.tsx` | 9003 | `8f3cebd881f13ef0bd3335c46cf8739182d593be6e152ff082578a79aedfc64c` | React (TSX) |
| `nextjs_space/app/community/articles/page.tsx` | 137 | `cf60948d14233937c0f071439538bc2c10ff10feea7826d2cd7c0a2f7a298051` | React (TSX) |
| `nextjs_space/app/community/assessment/_components/assessment-client.tsx` | 9111 | `726f4b2493dc80b0293564d2602ec95440cc5b267528361f8b450daedf7c66a2` | React (TSX) |
| `nextjs_space/app/community/assessment/page.tsx` | 145 | `0e8f0612e9f158fafd569dc4754660622630af95703be24cc0a07468d13e1c65` | React (TSX) |
| `nextjs_space/app/community/chat/_components/community-chat-client.tsx` | 6932 | `5690ac038b2a58d24d5f2b8be2395c3ed4fccd78f77e710737b2fb8e850048d6` | React (TSX) |
| `nextjs_space/app/community/chat/page.tsx` | 158 | `7e875592aec401bb479e0de8747e6bedcb9fe026312a669d2fd29fd2fe2dbd3b` | React (TSX) |
| `nextjs_space/app/community/first-aid/_components/first-aid-client.tsx` | 11247 | `67526d6cfcf6b84228786e394229419156d00a87405964fd290d6f34b716aa41` | React (TSX) |
| `nextjs_space/app/community/first-aid/page.tsx` | 138 | `ca248fd29ab43bcda5a9d3bccf0bc049dc4c769b896357fff97cc283b95326a8` | React (TSX) |
| `nextjs_space/app/community/image-check/_components/image-check-client.tsx` | 7747 | `3438b2437171e51f7d4df9f131122b5b58fbf52c67ea0b4d8a28e2c615e7c121` | React (TSX) |
| `nextjs_space/app/community/image-check/page.tsx` | 146 | `5201467ea93d8d720c3efd34489abacdb91a0fbe21c4b8f1f313550fab3207e5` | React (TSX) |
| `nextjs_space/app/community/layout.tsx` | 237 | `6506e06215d697af927763f873e60b71cb8443cea81fcddadbfcd4d29b4c66c9` | React (TSX) |
| `nextjs_space/app/community/page.tsx` | 154 | `d685be1ebe845d03fb9ece772553d9e1a6e8499a33cfa75147349ad7ef94b8b0` | React (TSX) |
| `nextjs_space/app/globals.css` | 3822 | `094f995cd47b9a72f19d0f767a2e8cfce5842e37e3f873db017f3441c17cae85` | Stylesheet |
| `nextjs_space/app/hcp/_components/dashboard-charts.tsx` | 6869 | `33a7d1d507cad6437e6d63c342aadb3df6a596696f2965dfc552271447feb6cf` | React (TSX) |
| `nextjs_space/app/hcp/_components/dashboard-client.tsx` | 3524 | `63a0d5c559245ea276e5379a020c5893df7f9c237ac59a62142e2d3d04dbfad1` | React (TSX) |
| `nextjs_space/app/hcp/_components/hcp-layout-client.tsx` | 10532 | `7ed0b116b29a9e7999f003fbc24b7de5af70474e3bf67ba282b338b1ac4c6aec` | React (TSX) |
| `nextjs_space/app/hcp/analysis/_components/analysis-client.tsx` | 20154 | `69797cb7509f52d0ae0f300e44bea3fc18c5b71f338e45935ef47d3bdd389f92` | React (TSX) |
| `nextjs_space/app/hcp/analysis/page.tsx` | 137 | `49d7f0ec883b2b7d656d4f63ae95cd620b10c40ea304f901812fedc0b7eae4f7` | React (TSX) |
| `nextjs_space/app/hcp/chat/_components/hcp-chat-client.tsx` | 8843 | `9c120796bc25cf9465c57b5481898f302089a611233d3ca3fb11c878aedcd201` | React (TSX) |
| `nextjs_space/app/hcp/chat/page.tsx` | 134 | `69ac219bd6f24de7504e45f2aec9d9dd9708a99a1b26d2ce6fe80662023c7d3b` | React (TSX) |
| `nextjs_space/app/hcp/guidelines/_components/guidelines-client.tsx` | 13316 | `e39a91cc37c06b1c436453aef30f167c9f51fda08324ee7a5ed675d4a9b59e90` | React (TSX) |
| `nextjs_space/app/hcp/guidelines/page.tsx` | 145 | `1b1e17801e9f9ee80d383869f0cdfb67bae78be4527396551b9b1f4f13fc536b` | React (TSX) |
| `nextjs_space/app/hcp/layout.tsx` | 207 | `c9cb7e447cd9359bb0cb10292a94abe1715d573620c8613b91ab5ea7491cb00b` | React (TSX) |
| `nextjs_space/app/hcp/page.tsx` | 140 | `589ba5bc0788bfbd67f36e1a234d235822a5eab9d7141ed9e6520228285b31a4` | React (TSX) |
| `nextjs_space/app/hcp/parkland/_components/parkland-client.tsx` | 7725 | `e9860106275da500a1698aebe2ce4c07a87bf104d0350c67205a2b3f62344039` | React (TSX) |
| `nextjs_space/app/hcp/parkland/page.tsx` | 137 | `28936d7806d315789a13433a4e4cfa347487e1a77de17d5225beb943d66274df` | React (TSX) |
| `nextjs_space/app/hcp/tbsa/_components/tbsa-client.tsx` | 28878 | `cb4bc2ad791822fb22c105f3e7a6e8877afee1573b040ed55e7bc29b995cb7c4` | React (TSX) |
| `nextjs_space/app/hcp/tbsa/page.tsx` | 121 | `7c4fe7908d3e5298bd129cebb899acda9559adfa856081fcacdb31adccceb154` | React (TSX) |
| `nextjs_space/app/hcp-login/page.tsx` | 9789 | `9a8c3753fb8a67e4be565d7b3232249934b16cdd3599bd95e30b4f1e36beae79` | React (TSX) |
| `nextjs_space/app/layout.tsx` | 2411 | `50ffc3fdfd043473f21dfaba5ceea2bd6ca3e579814e8b0eaf4f32fc1f90fb80` | React (TSX) |
| `nextjs_space/app/page.tsx` | 133 | `cbe5d68bdf60513a8ba2575edb0ed66e0685516c3c0f091066c7cd4d5fd396f9` | React (TSX) |
| `nextjs_space/components.json` | 417 | `12cefe2aa2af92c55446abc2b1a101d48303777af844155424db96d80a3c49dd` | JSON |
| `nextjs_space/components/chunk-load-error-handler.tsx` | 718 | `32cec93b6026177a9c419a3cdda67972ef9a02483c8d7cb361c2bf49d7e407ec` | React (TSX) |
| `nextjs_space/components/language-provider.tsx` | 794 | `1eeacb297fdfc6125ba800043d2e37d6e5ef92c515568b284a9fdc3b3f1af19c` | React (TSX) |
| `nextjs_space/components/language-toggle.tsx` | 1071 | `762472c457712aae6792b9ae531dcfda5538db2507d506246dab560b262cfc70` | React (TSX) |
| `nextjs_space/components/layouts/app-shell.tsx` | 1704 | `b5ee1b165a6ec9f22aaa551d92a2a849ae2b48dc1d1b94dbe672141ccdcbc464` | React (TSX) |
| `nextjs_space/components/layouts/auth-layout.tsx` | 870 | `a0815b7c3f8b52c0a07f4727639f526c22ce2fda73a82a1897642b18d0ba74dd` | React (TSX) |
| `nextjs_space/components/layouts/container.tsx` | 497 | `2fcc3cd9597460a02f134205c274959b4528ef601049d67c1cac383d413e2755` | React (TSX) |
| `nextjs_space/components/layouts/page-header.tsx` | 654 | `29f1de8b2deb83ee7fe2ff71a08b39fb01acb98fee0833a1e43d5b4fe26e0221` | React (TSX) |
| `nextjs_space/components/layouts/section.tsx` | 286 | `f8d693bf51c1b8a8c071605f6ad9d980e0ccc6a3832cedef2fc0484bf8f2cba1` | React (TSX) |
| `nextjs_space/components/pwa-install-prompt.tsx` | 5629 | `01e66e25579271a02b6e12832cdecdb510c032df2adfad430e8cb4b3e149ef3d` | React (TSX) |
| `nextjs_space/components/pwa-register.tsx` | 243 | `c9913c9639478852281ae08d20853119bd3e95b2c0174b2006cc585444cebac9` | React (TSX) |
| `nextjs_space/components/theme-provider.tsx` | 327 | `07e5c224ebb680ed0db8ddbe5863870cb62d598bfc60f0948fdd668ab5f1920e` | React (TSX) |
| `nextjs_space/components/theme-toggle.tsx` | 629 | `74bae039ad1cc7f4f46cb521d933f694ee4f27856a43b9df98bf545c083883ad` | React (TSX) |
| `nextjs_space/components/ui/accordion.tsx` | 2004 | `ba6ca16e63e545ccb8317a0107a0f0909a53fe7aa8dc1f04a719d4e070dd6819` | React (TSX) |
| `nextjs_space/components/ui/alert.tsx` | 1595 | `343efa64aad155f1097c45e58243ee9c0102f23697e817adf20cd29365035821` | React (TSX) |
| `nextjs_space/components/ui/alert-dialog.tsx` | 4459 | `84888a8d76cd850e75dc8d2092303b319fdfb36fa4a769e967ce463e2b90cdb2` | React (TSX) |
| `nextjs_space/components/ui/animate.tsx` | 3299 | `31260fc2b90ac575d84e7668d478a5a1f7b6374afeb420709228716ab11e0411` | React (TSX) |
| `nextjs_space/components/ui/aspect-ratio.tsx` | 158 | `9c2338fa109b3fbdfc1767c0d1c0f4c396a39895c7f778343f4c4b897843ed66` | React (TSX) |
| `nextjs_space/components/ui/avatar.tsx` | 1430 | `da992eb96f72288d735f4dfabc92857a6437eb5eed2c0c75516d4e4a21c23e3a` | React (TSX) |
| `nextjs_space/components/ui/badge.tsx` | 1134 | `354ef7f51c4370250e1fcd878b4e86e80c465ee3a1bfde2dd66dcae5d601c6f8` | React (TSX) |
| `nextjs_space/components/ui/breadcrumb.tsx` | 2724 | `6f161990b5a321a024e1f2c9b411a6558384b111ffff4ef6ca9aeec8fd1fe534` | React (TSX) |
| `nextjs_space/components/ui/button.tsx` | 3150 | `2da9ab2ebf0a09ecdcba4985de7e5e03a3aaac99a10fb695e0833d0b8ff81f9c` | React (TSX) |
| `nextjs_space/components/ui/calendar.tsx` | 2633 | `1093e85516e04f669e7e20afee4230e8fc7bbd251201845aa102190aab4ce41c` | React (TSX) |
| `nextjs_space/components/ui/card.tsx` | 3333 | `1c000c04163b99b3c60a81a085510c556b3c905ccef6ad4d4eca39fa4851305a` | React (TSX) |
| `nextjs_space/components/ui/carousel.tsx` | 6296 | `9017e9bcdc69a8f98d24cb273c76890b5cde375c722c76a3e8ebedf4c8ee6444` | React (TSX) |
| `nextjs_space/components/ui/checkbox.tsx` | 1078 | `35ff2274fe90d25d2b85adfae48490cfd1be6b139352f8982e8cf33215e8b2da` | React (TSX) |
| `nextjs_space/components/ui/collapsible.tsx` | 335 | `aedcd10b62404b39d8d5544c01fee90aa7b66e7280bb80a215601ad198a1b8fd` | React (TSX) |
| `nextjs_space/components/ui/command.tsx` | 4920 | `dce6eafe749c5b3a27f33d0380f3f6926a4f4413c77e6a157918c059c399cf29` | React (TSX) |
| `nextjs_space/components/ui/context-menu.tsx` | 7294 | `86914afb946c5e63e58c1a5529c277e2ce82c34dd381c52f01d17ac0b8a80bc8` | React (TSX) |
| `nextjs_space/components/ui/date-range-picker.tsx` | 1791 | `bac38aecac2a965a855a6d19a49bbd555796a5f55747e67e6be83ebe34e5b8f2` | React (TSX) |
| `nextjs_space/components/ui/dialog.tsx` | 3871 | `efb08d2d263d9889f9c4f76f7101b466a90032209dbd82409504a6c76d131993` | React (TSX) |
| `nextjs_space/components/ui/drawer.tsx` | 3043 | `b15899ea2ab2c6cfa35b76104636739acb93d3ce8068ab12fe44a0916bc6e582` | React (TSX) |
| `nextjs_space/components/ui/dropdown-menu.tsx` | 7343 | `0b7613aaafd0a3c73b39ef44248c391be81cc7a72caac7340c3ca5c50a7228b1` | React (TSX) |
| `nextjs_space/components/ui/form.tsx` | 4150 | `2e96f82f3762021269110f8a8b024c367dcd701994e22ae67f89a9762099e331` | React (TSX) |
| `nextjs_space/components/ui/hover-card.tsx` | 1207 | `ccc1af95a56dfa03b77dc0407f3169aad57b9d8de42cdcdbde9894214accfd85` | React (TSX) |
| `nextjs_space/components/ui/input.tsx` | 2058 | `6f94a82913d553c2dfe4c440c323a5d23d5521ae016b9f3a81095e3890d7450b` | React (TSX) |
| `nextjs_space/components/ui/input-otp.tsx` | 2185 | `9ba2e6103428da3a5dce291a9f8604e305dd7313db33a9fb9ebb827c0ef8ee8b` | React (TSX) |
| `nextjs_space/components/ui/label.tsx` | 723 | `bdc5dedee7aec6157d492b96eca4c514c43ab48f291471b27582cd33a3e72e86` | React (TSX) |
| `nextjs_space/components/ui/menubar.tsx` | 8025 | `d705478624f4ce9370ea585c636fa401f6788c7c119a56c9d4bccbe54a17c27c` | React (TSX) |
| `nextjs_space/components/ui/navigation-menu.tsx` | 5067 | `3aaaeaa17a258500e5899483ecba8b030782eae459d3986ad6d63d26f171c260` | React (TSX) |
| `nextjs_space/components/ui/pagination.tsx` | 2772 | `ca07862d9bba2f76bde6e0cfa108d0ffa11e497725de676d6b4ed8107a513a66` | React (TSX) |
| `nextjs_space/components/ui/popover.tsx` | 1253 | `2cd24fbc2c91c225d496060f2f10d55f884e643f682bfb5c06aa51cbc305c10a` | React (TSX) |
| `nextjs_space/components/ui/progress.tsx` | 798 | `9c1ea4565f1c2f82addcab6cc532aa745b79401f1945932556d1cd31e79202ab` | React (TSX) |
| `nextjs_space/components/ui/radio-group.tsx` | 1493 | `9c082ffa20d190f8b6d119ba0c5be44c7545e50da56251acdaa1aeb8eebfa5f5` | React (TSX) |
| `nextjs_space/components/ui/resizable.tsx` | 1732 | `940c7535de09668b16fc9a671100b9f5693b1af2b7980da72e27d9fe0531f205` | React (TSX) |
| `nextjs_space/components/ui/scroll-area.tsx` | 1665 | `f4ea03f4d64c61ab5c8a2820c41f42fda19524718f792728e0a84dfd20b4354e` | React (TSX) |
| `nextjs_space/components/ui/select.tsx` | 5652 | `8d243886e3a31297de445f6a91bfacae41dc50f5f4bb549fd2d68ee7cddba617` | React (TSX) |
| `nextjs_space/components/ui/separator.tsx` | 777 | `beaa135aba592ee287a049db614af9935c0df8c349a76ca95f91d503fca63c9f` | React (TSX) |
| `nextjs_space/components/ui/sheet.tsx` | 4305 | `7c8f938c4986c1c022fbf5e5e73ac76a70de595a7cebd80183e0c9b1f0567f5c` | React (TSX) |
| `nextjs_space/components/ui/skeleton.tsx` | 264 | `43b0afa75a641b3298dbe332a0a3cc214bb30f8b77d39c020ebc1f176f051321` | React (TSX) |
| `nextjs_space/components/ui/slider.tsx` | 1098 | `00782d16e4ad5d90e061780fddc4da735e4dcad53527a8360095c3c518eae354` | React (TSX) |
| `nextjs_space/components/ui/sonner.tsx` | 902 | `de5a5d9ae404545fcb0f21123530ffcf89d24a47812c70b3ca1376591e28dbdd` | React (TSX) |
| `nextjs_space/components/ui/switch.tsx` | 1160 | `bdc148b0770830d4658f8fe921618bca6c52fc28ab591190b022f1d9653224ac` | React (TSX) |
| `nextjs_space/components/ui/table.tsx` | 2784 | `6215a80d50a9f155ffb0917ab23832380ad50bc17bf6b79918d854642f0e1f57` | React (TSX) |
| `nextjs_space/components/ui/tabs.tsx` | 1909 | `daacc53a22e63862f7242fa2892a6eedabe6acfbb719a0679cf9d6d683594354` | React (TSX) |
| `nextjs_space/components/ui/task-card.tsx` | 1997 | `5bcf3c8ef23cc5f3ce212a6638ebae666fa130fa9be03908bd2242a85a7639e8` | React (TSX) |
| `nextjs_space/components/ui/textarea.tsx` | 1834 | `e142a408d268604e77414e592be96c1419700494922de0da2d1e4bab7f1c89f6` | React (TSX) |
| `nextjs_space/components/ui/toast.tsx` | 4883 | `88177c1b08789127a549e92991c7d1d91a00c6f1bb8f3d4056d0322dcbe95229` | React (TSX) |
| `nextjs_space/components/ui/toaster.tsx` | 792 | `245b319bc739b7a4513dfeec86ac18859dc256711af5439be094ef8f5dd94ee4` | React (TSX) |
| `nextjs_space/components/ui/toggle.tsx` | 1458 | `4d4d244c3251fc12eb9f72a5a0173bd3d0b153f6ae2c32462c9869df5b9ebd47` | React (TSX) |
| `nextjs_space/components/ui/toggle-group.tsx` | 1767 | `b6f3a9143bfda78945247923fbaca551355df378cc5736d06061e31f8731c50b` | React (TSX) |
| `nextjs_space/components/ui/tooltip.tsx` | 1169 | `86030b2106cbfa126e1e538dada690a35b4e8f94abaa20d235b30443bf296de6` | React (TSX) |
| `nextjs_space/components/ui/use-toast.ts` | 4005 | `cc7a43baee74d3d2b7ccf9517b24d5558dd66763e701dae60424d389a5711aa5` | TypeScript |
| `nextjs_space/hooks/use-toast.ts` | 4005 | `cc7a43baee74d3d2b7ccf9517b24d5558dd66763e701dae60424d389a5711aa5` | TypeScript |
| `nextjs_space/lib/aws-config.ts` | 273 | `edc979d098442de3f5b56c3eb9d67e6d5b63da5ca5bb414a874cc089cb35eb0d` | TypeScript |
| `nextjs_space/lib/db.ts` | 279 | `53681fda57ca9b2f827bda1b541ea379f380d949f52a870baee8f08c502169c2` | TypeScript |
| `nextjs_space/lib/i18n.ts` | 10647 | `8017845473b0aaa813eedea90497aab1d2f9e8507747773989248630a4816e86` | TypeScript |
| `nextjs_space/lib/s3.ts` | 1907 | `59633c7f900660f179362ce1f1b50fcce6cdda2a0c397f9b1c71312a3b139fc3` | TypeScript |
| `nextjs_space/lib/types.ts` | 447 | `9c9992f2312146e50939e8d50f548ccd94c65d7961ada64870827be9c550520d` | TypeScript |
| `nextjs_space/lib/utils.ts` | 498 | `ab626dd364f4f112865d13348b9b6aa24979f069d14b7799cfc70c82340359d4` | TypeScript |
| `nextjs_space/next.config.js` | 726 | `049cae92a101a7d70ad3830c60b4607e575fa16df47303cdce3533928f33e68d` | JavaScript |
| `nextjs_space/package.json` | 3865 | `ab1e2e4bec87b3163d4132661a4db8dee93b8a51f2552c1fba6b5903feff9ef2` | JSON |
| `nextjs_space/package-lock.json` | 568898 | `68b38fe8ba9634171ce51bc5cb4428742240f3486b3e317a1c435cc21f601a15` | JSON |
| `nextjs_space/postcss.config.js` | 83 | `fa650b380adfabb151a0b352f7135e107e6352345f899060f1c5c231228f94bf` | JavaScript |
| `nextjs_space/prisma/schema.prisma` | 1605 | `1c2d4906e7c81bd576c329154d5ee3995e6da860e067d650f7aae6b1e283f9ae` | Prisma schema |
| `nextjs_space/public/favicon.svg` | 972 | `99ba479faab8480de41d876bcc800f89265aa02d7c15baa79edf6116b94d2108` | Image (SVG) |
| `nextjs_space/public/icons/apple-touch-icon.png` | 16528 | `733275ecb4abacff51ceafdefe554665a2b914b1f50791593d666f0520cfe31e` | Image (PNG) |
| `nextjs_space/public/icons/icon-128.png` | 10183 | `964fd02a34e54aeff25c04bdbdf0b7122a2ad75799cb718c13ad3188a95197e1` | Image (PNG) |
| `nextjs_space/public/icons/icon-144.png` | 12026 | `6c072cf55bed29ad68d37d442c888db25591cbdc5cc57cd21513045db8c2ee32` | Image (PNG) |
| `nextjs_space/public/icons/icon-152.png` | 12988 | `5314e46e60a05c6f449c7782a6b9ee1b1728bb5898e9e9a0a0656ba2d00722ec` | Image (PNG) |
| `nextjs_space/public/icons/icon-192.png` | 18192 | `65beda3ace5671aaa729ec3cbfbe44a6c5b093c823b325d9bb0868f0c50237e3` | Image (PNG) |
| `nextjs_space/public/icons/icon-384.png` | 52525 | `06dd6b49a4a513d525bbec90211c74ea202edcaceb437de87c20cca254ac5446` | Image (PNG) |
| `nextjs_space/public/icons/icon-512.png` | 85161 | `3e7d1213b31946da55829958eefd39bbf39080274a073203a0376eb23866216a` | Image (PNG) |
| `nextjs_space/public/icons/icon-72.png` | 4504 | `4a9b0782d7752da1f4d422846ef71427bbc672a6cdda82b5cbaecb32fc5156d0` | Image (PNG) |
| `nextjs_space/public/icons/icon-96.png` | 6780 | `47b9bb564d3b9fdecbd149f3565ba93fff9569d8e9bf88b2f2c728ea69593361` | Image (PNG) |
| `nextjs_space/public/kkm-hkl-logo.jpeg` | 14537 | `4e6055437ed29f89e69e07abba2410df031befd41e638eb4d36626f914699a4f` | Image (JPEG) |
| `nextjs_space/public/logo.png` | 346691 | `dfb40a3ef32007ceef3c06f11a48d6b1794178d240d74e716f34e6f4917d8241` | Image (PNG) |
| `nextjs_space/public/manifest.json` | 1859 | `bb3380ac3cfa57eaebf6b8be7cffc6f229bd69caec429b7077b15315d7063a54` | JSON |
| `nextjs_space/public/og-image.png` | 48620 | `ec654a534a071d4b5580f8e9e1f711f0b64b7b924d09350374e73f59beb24ab5` | Image (PNG) |
| `nextjs_space/public/sw.js` | 1156 | `edc3c8f682e6a72fed4d7cb00ad681793127740ff82a891b4c0549386edd783f` | JavaScript |
| `nextjs_space/public/tbsa-anterior.png` | 7302 | `8e8852ff88456b7962180ac7077df4cce083a61dabf28b6b0da7c7f573ac23d5` | Image (PNG) |
| `nextjs_space/public/tbsa-anterior-mask.png` | 5825 | `c508a9f59ed5a67964250549313ffc8c4262702855d6d997cc284fd5a346f272` | Image (PNG) |
| `nextjs_space/public/tbsa-posterior.png` | 7370 | `36cd130e3bd505e5e0614cf43f4e0acffafcdac0a03a4197d8f0a833ad7a18ab` | Image (PNG) |
| `nextjs_space/public/tbsa-posterior-mask.png` | 6021 | `4cfedd1d9e758a99bb2941803cfd13ebfe31f096ad4dca0cd34e88f3a15be2df` | Image (PNG) |
| `nextjs_space/scripts/safe-seed.ts` | 901 | `96927762aed347013e80dbd436fa6ddc0ca4cd3fdc76f4a1de641ac20f9de612` | TypeScript |
| `nextjs_space/STYLE_GUIDE.md` | 9059 | `eb979ab7389382e176f65fd18db8420a190164092e6d264b09f1162dad0a2303` | Markdown |
| `nextjs_space/tailwind.config.ts` | 3482 | `4cd026e8fb55155ec4a33f667603e42d20c3938003eeb9ab37a729f7ea400d41` | TypeScript |
| `nextjs_space/tsconfig.json` | 707 | `556f399dc047f890b68762d8ae44d695c14b2b3eb3eb2b9ded13a3b1a4a4e8eb` | JSON |
| `nextjs_space/types/next-auth.d.ts` | 526 | `bc29568005767109beb748e48f506af534d6baba5212d33c6b20b75c8706644c` | TypeScript |
| `README.md` | 4399 | `da7f5fc874e09e6993a39a33cc547ec973773d0d388e6d98f156af820408a246` | Markdown |
| `Shared.zip` | 22 | `8739c76e681f900923b900c9df0ef75cf421d39cabb54650c4b9ad19b6a76d85` | Other (.zip) |
| `Uploads/6ed27144-5d62-4d6d-8f21-9dee746b7669.png` | 346691 | `dfb40a3ef32007ceef3c06f11a48d6b1794178d240d74e716f34e6f4917d8241` | Image (PNG) |
| `Uploads/acc-2019-00647f1 (1).jpg` | 59507 | `3db061582e09ed229451bd42b901bedd0311e4719f13523ad56bedd3f1d9ff05` | Image (JPEG) |
| `Uploads/acc-2019-00647f1.jpg` | 59507 | `3db061582e09ed229451bd42b901bedd0311e4719f13523ad56bedd3f1d9ff05` | Image (JPEG) |
| `Uploads/images.jpeg` | 14537 | `4e6055437ed29f89e69e07abba2410df031befd41e638eb4d36626f914699a4f` | Image (JPEG) |
| `Uploads/red-cross-courses-kelowna-british-columbia (922) (1).jpg` | 41365 | `daa6b154f23f420ecee0b75dbc07401a702afea440700cf5886008cf3e5fc309` | Image (JPEG) |
| `Uploads/red-cross-courses-kelowna-british-columbia (922) (2).jpg` | 41365 | `daa6b154f23f420ecee0b75dbc07401a702afea440700cf5886008cf3e5fc309` | Image (JPEG) |
| `Uploads/red-cross-courses-kelowna-british-columbia (922).jpg` | 41365 | `daa6b154f23f420ecee0b75dbc07401a702afea440700cf5886008cf3e5fc309` | Image (JPEG) |
| `Uploads/Screenshot 2026-07-23 at 9.15.42 AM.png` | 343875 | `6958796ed9f86974acec50a39cb7db75349e31899b59b2a4a911a9d4c7806bfc` | Image (PNG) |
| `Uploads/Screenshot 2026-07-23 at 9.30.32 AM.png` | 118767 | `57052c19cfed23e343626efb0ba9f8b95fc093e43dbafe77236c27a31f83f32d` | Image (PNG) |
| `Uploads/Screenshot 2026-07-23 at 9.42.21 AM.png` | 433976 | `6de3bfdae725d487b9e3acb1bce06d7f5d77b15d6dcd53d8a26d8f4b45fcc86b` | Image (PNG) |
| `Uploads/Short Phoenix AI Video.mp4` | 9353759 | `2bcf9456a9e52aefdca75bf6bb22d85b1808d82b9cbf9629dc113d7d3eb6fd9e` | Other (.mp4) |

---

## How this baseline is enforced

1. **Git tag `abacus-source-baseline`** points at the commit that carries this manifest — an
   immutable reference to the imported Abacus.AI source.
2. **Branch `migration/azure-port`** is where all Azure port work happens; the tag remains fixed.
3. Any future asset (especially `public/logo.png`) can be re-hashed and compared against the
   values above to prove byte-for-byte fidelity.

### Regenerate / verify the whole manifest (PowerShell)
```powershell
git ls-files | ForEach-Object {
  if (Test-Path $_) {
    "{0}  {1}  {2}" -f (Get-FileHash -Algorithm SHA256 $_).Hash.ToLower(),
                        (Get-Item $_).Length, $_
  }
}
```
