# Boxer von Tabitha — Umsetzungsplan (Website + Supabase-DB + Dashboard)

> **Stand:** Vollständig aktualisierte Fassung, konsolidiert aus Ultraplan +
> Änderungsprotokoll + allen seither getroffenen Entscheidungen. Dieses
> Dokument ersetzt alle vorherigen Planungs-Textdateien — es ist die einzige
> Quelle der Wahrheit für den Projektstand.

## Live-URLs

| Projekt | URL | Typ |
|---------|-----|-----|
| Website | https://boxer-vom-hause-tabitha.vercel.app | Production |
| Dashboard | https://dashboard-delta-seven-67.vercel.app | Production |

Dashboard-Login-Passwort: in `Vercel/Environmental Settings` als `VITE_ADMIN_PASSWORD`.

---

## Context

Das Repo (`boxer-von-tabitha`, Monorepo, Default-Branch `main`) war zu
Planungsbeginn leer — nur eine leere `index.html`. Der Nutzer lieferte eine
vollständige deutsche Projektspezifikation ("Ultraplan") für ein
dreiteiliges System für eine Boxer-Zucht: eine statische Marketing-/
Zuchtbuch-Website, eine Supabase-(Postgres-)Datenbank für Zuchtdaten, und
ein React-Admin-Dashboard für die Züchterin, ihre Großmutter ("Oma") und
ihre Tante ("Tante"), damit die Daten ohne SQL-Kenntnisse gepflegt werden
können.

Grundsatzentscheidungen (per Rückfragen geklärt):
- **Repo-Layout**: Monorepo. Website liegt am Repo-Root (reines HTML/CSS/JS).
  Dashboard liegt in `dashboard/` mit eigener `package.json`, als separates
  Vercel-Projekt deployt.
- **Supabase**: echtes Projekt wird live über die Supabase-MCP-Tools
  provisioniert und migriert — nicht nur SQL-Dateien zur manuellen Anwendung.
- **Offene Spec-Fragen**: mit den im Ultraplan selbst vorgeschlagenen
  Defaults aufgelöst — 30 Tage Papierkorb-Aufbewahrung, Freitext für
  Gesundheitscheck-/Prüfungsfelder (noch keine festen Dropdowns), Dashboard-
  Subdomain `dashboard.boxer-von-tabitha.de`.
- **Wurf-Vater-Fallback**: `wuerfe` bekommt `vater_extern_name`/
  `vater_extern_zwinger`, gespiegelt zu `hunde`, für Rüden, die nicht in der
  Datenbank stehen.
- **supabase-js-Loading**: CDN-Import via `esm.sh` (`<script type="module">`),
  keine vendored Kopie — einfacher, ein Third-Party-Request pro Seite wird
  akzeptiert.
- **Dashboard-Philosophie**: einziger Zweck ist, dass eine nicht-technische
  Admin-Person (Oma) (a) Hundedaten in die Datenbank eintragen und (b) sie
  wieder nachschlagen kann — nichts weiter. Kein generisches Datenwerkzeug;
  jeder Screen bleibt so nah wie möglich an "eintippen, wieder sehen". Was
  hier eingetragen wird, erscheint live auf der öffentlichen Seite je Hund.
- **Website-Hundeseite = Tabs**: `hund.html?id=…` zeigt Übersicht/Gesundheit/
  Prüfungen als Tabs statt einem langen Scroll.
- **Kein visueller "Stammbaum"**: `mutter_id`/`vater_id` und die
  Extern-Name/Zwinger-Felder bleiben im Schema und werden als Klartext auf
  dem Übersicht-Tab angezeigt — kein eigener Pedigree-Tab, kein
  Baum-Diagramm, keine Mehrgenerationen-Visualisierung.
- **Fotoupload**: `foto_url` wird automatisch über einen Supabase-Storage-
  Bucket + Upload-Button im Dashboard-Hundeformular gesetzt — nie von Hand
  eingetippt. Siehe Abschnitt 2a.

---

## 1. Repo-Struktur

```
boxer-von-tabitha/
├── .gitignore
├── README.md
├── .stylelintrc.json                # kebab-case für Klassen/IDs
│
├── index.html                       # Home / News-Feed (Beiträge aus Supabase)
├── hunde.html                       # Hunde-Übersicht (live Supabase)
├── hund.html                        # Hunde-Detail (?id=..., live Supabase)
├── ehemalige.html                   # Ehemaligengalerie — Full-Width-Slider, auto-scroll, Modal
├── ueber-mich.html                  # Züchterin-Bio (statischer Platzhalter)
├── kontakt.html                     # Kontaktformular (Formspree)
├── impressum.html                   # §5 TMG, Platzhalter-Identitätsdaten
├── datenschutz.html                 # Datenschutzerklärung (inhaltlich fertig, nur Identität als Platzhalter)
│
├── partials/
│   ├── header.html                  # Nav + Siegel-Badge
│   ├── footer.html
│   └── seal-badge.html              # wiederverwendbares "Zuchtbuch-Stempel"-SVG/Markup
│
├── css/
│   ├── tokens.css                   # siehe Abschnitt 4 — Farben/Fonts
│   ├── fonts.css                    # @font-face (self-hosted)
│   ├── base.css                     # Reset + Basis-Typografie
│   └── components.css               # Cards, Nav, Siegel, Formulare, Footer, Buttons
│
├── js/
│   ├── config.js                    # SUPABASE_URL / SUPABASE_ANON_KEY Konstanten
│   ├── supabase-client.js           # createClient() via esm.sh CDN-Import, Wrapper-Modul
│   ├── partials.js                  # fetch()+inject Header/Footer/Siegel-Fragmente
│   ├── posts.js                     # index.html: posts.json laden/sortieren/rendern
│   ├── hunde.js                     # hunde.html: veröffentlichte Hunde holen, Grid rendern
│   ├── hund.js                      # hund.html: einen Hund + Pedigree/Gesundheit/Prüfungen holen
│   ├── tabs.js                      # geteilt: Tab-Umschaltung für hund.html-Panels
│   └── age.js                       # geteilt: Alter aus geburtsdatum berechnen
│
├── data/
│   └── posts.json                   # veraltet — Beiträge werden jetzt aus Supabase (beitraege-Tabelle) geladen
│
├── fonts/
│   ├── sora/*.woff2
│   ├── manrope/*.woff2
│   └── ibm-plex-mono/*.woff2
│
├── img/
│   ├── placeholder-dog.svg
│   └── og-image.jpg                 # optional, später
│
├── .vercelignore                    # schließt "dashboard" vom Root-Static-Deploy aus
│
├── supabase/
│   └── migrations/
│       ├── 0001_init_schema.sql     # ✅ angewendet
│       ├── 0002_rls_policies.sql    # ✅ angewendet (Teil von 0001-Datei, siehe Abschnitt 2)
│       ├── 0003_trash_purge_job.sql # ✅ angewendet
│       └── 0004_storage_bucket.sql  # ✅ angewendet
│
└── dashboard/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    ├── vercel.json                  # SPA-Rewrite (alle Routen -> index.html)
    ├── .env.example                 # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
    ├── public/
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── router.tsx
        ├── lib/supabaseClient.ts
        ├── types/database.types.ts   # ✅ generiert, siehe Abschnitt 3a
        ├── auth/
        │   ├── AuthProvider.tsx
        │   ├── LoginPage.tsx
        │   └── ProtectedRoute.tsx
        ├── pages/
        │   ├── DashboardHome.tsx     # redirect zu DogsListPage — das IST der Home-Screen
        │   ├── DogsListPage.tsx      # Suche nach Name, Filter Veröffentlicht/Entwurf/Geschlecht
        │   ├── DogFormPage.tsx
        │   ├── DogDetailPage.tsx     # verschachtelte Gesundheitschecks + Prüfungen
        │   ├── LittersListPage.tsx   # Suche nach Mutter, Filter nach Jahr
        │   ├── LitterFormPage.tsx
        │   ├── BuyersListPage.tsx
        │   ├── BuyerFormPage.tsx
        │   ├── SalesListPage.tsx
        │   ├── SaleFormPage.tsx
        │   ├── PostsListPage.tsx     # Suche nach Titel, Filter Veröffentlicht/Entwurf/Jahr
        │   ├── PostFormPage.tsx
        │   ├── EhemaligeListPage.tsx # Suche nach Name, Filter Veröffentlicht/Entwurf
        │   ├── EhemaligeFormPage.tsx # inkl. Multi-Foto-Upload via GalerieUpload
        │   └── TrashPage.tsx
        ├── components/
        │   ├── Layout.tsx
        │   ├── ConfirmDeleteDialog.tsx
        │   ├── PublishToggle.tsx
        │   ├── PhotoUpload.tsx       # Einzelfoto-Upload → foto_url auf hunde-Tabelle
        │   ├── GalerieUpload.tsx     # Multi-Foto-Upload für Ehemalige (bucket + entityId + bilder[])
        │   ├── Spinner.tsx           # PageSpinner für Loading-States
        │   ├── StatusButton.tsx      # Button mit Loading/Success/Error-State
        │   └── FormError.tsx         # animierter Fehlerhinweis mit slide-in + useShake
        ├── hooks/
        │   └── useDogs.ts, useHealthChecks.ts, useExams.ts, useLitters.ts, useBuyers.ts,
        │       useSales.ts, usePosts.ts, useEhemalige.ts, useTrash.ts
        └── styles/
            └── tokens.css            # portierte Marken-Tokens fürs Dashboard-UI (identisch zu css/tokens.css)
```

**Vercel-Monorepo-Setup (2 Projekte, ein Repo):**
- Projekt A (`boxer-von-tabitha-web`): Root Directory `.`, Framework Preset
  "Other" (kein Build). `.vercelignore` enthält `dashboard`, damit der
  statische Deploy nie den Dashboard-Quellcode ausliefert.
- Projekt B (`boxer-von-tabitha-dashboard`): Root Directory `dashboard`,
  Framework Preset "Vite". `dashboard/vercel.json` fügt einen SPA-Rewrite
  hinzu, da React Router einen braucht.

---

## 2. Supabase-Schema, RLS und Trash-Purge — ✅ live deployed

> **Wichtig:** Dieses Schema weicht an mehreren Stellen vom ursprünglichen
> Ultraplan ab. Grund: Das interaktive Admin-Tool-Mockup (Abschnitt 5a)
> wurde vor der DB gebaut, und beim Abgleich fielen strukturelle
> Widersprüche auf, die hier zugunsten des Mockup-Datenmodells aufgelöst
> wurden — das ist jetzt der verbindliche Stand, nicht der Ultraplan-Text.

### `supabase/migrations/0001_init_schema.sql`

```sql
create extension if not exists pgcrypto; -- gen_random_uuid()

create table hunde (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  geburtsdatum date not null,
  geschlecht text not null,
  foto_url text,
  mutter_id uuid references hunde(id) on delete set null,
  vater_id uuid references hunde(id) on delete set null,
  mutter_extern_name text,
  mutter_extern_zwinger text,
  vater_extern_name text,
  vater_extern_zwinger text,
  veroeffentlicht boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table gesundheitschecks (
  id uuid primary key default gen_random_uuid(),
  hund_id uuid not null references hunde(id) on delete cascade,
  kategorie text not null,   -- Freitext (HD/ED-Röntgen, Herzultraschall, ...)
  ergebnis text not null,
  tierarzt text,
  notiz text,
  datum date not null,
  deleted_at timestamptz
);

create table pruefungen (
  id uuid primary key default gen_random_uuid(),
  hund_id uuid not null references hunde(id) on delete cascade,
  art text not null,         -- Freitext (Zuchttauglichkeitsprüfung, Wesenstest, ...)
  ergebnis text not null,
  ort text,                  -- Ort / Verein
  notiz text,
  datum date not null,
  deleted_at timestamptz
);

create table wuerfe (
  id uuid primary key default gen_random_uuid(),
  mutter_id uuid not null references hunde(id) on delete cascade,
  vater_id uuid references hunde(id) on delete set null,
  vater_extern_name text,
  vater_extern_zwinger text,
  datum date not null,
  anzahl_ruden integer not null default 0,
  anzahl_huendinnen integer not null default 0,
  notiz text,
  deleted_at timestamptz
);

create table kaeufer (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ort text,
  email text,
  telefon text,
  notiz text,
  deleted_at timestamptz
);

create table verkaeufe (
  id uuid primary key default gen_random_uuid(),
  wurf_id uuid not null references wuerfe(id) on delete cascade,
  welpe_label text not null,   -- Freitext, z. B. "Welpe 2 (Rüde, braun)"
  kaeufer_id uuid not null references kaeufer(id) on delete cascade,
  datum date not null,
  preis numeric,
  notiz text,
  deleted_at timestamptz
);

create index on hunde (veroeffentlicht) where deleted_at is null;
create index on gesundheitschecks (hund_id);
create index on pruefungen (hund_id);
create index on wuerfe (mutter_id);
create index on verkaeufe (wurf_id);
create index on verkaeufe (kaeufer_id);
```

**Abweichungen ggü. Ultraplan, mit Begründung:**

| Tabelle | Ultraplan | Jetzt (deployed) | Warum |
|---|---|---|---|
| `verkaeufe` | `welpe_id uuid references hunde(id)` | `wurf_id uuid references wuerfe(id)` + `welpe_label text` | Ultraplan hätte für jeden verkauften Welpen einen eigenen `hunde`-Datensatz verlangt. Mockup erfasst Welpen nur als Freitext innerhalb eines Wurfs — dafür entschieden, weniger Erfassungsaufwand für Oma. Konsequenz: einzelne Welpen sind nicht eigenständig verfolgbar/stammbaumfähig. |
| `wuerfe` | `anzahl_welpen integer` | `anzahl_ruden integer` + `anzahl_huendinnen integer` | Mockup erfasst Rüden/Hündinnen getrennt. |
| `gesundheitschecks` | `kategorie`, `ergebnis`, `datum` | + `tierarzt`, `notiz` | Mockup-Formular hat diese Felder. |
| `pruefungen` | `art`, `ergebnis`, `datum` | + `ort`, `notiz` | Mockup-Formular hat diese Felder. |
| `kaeufer` | `adresse text`, `kontakt text` | `ort`, `email`, `telefon`, `notiz` (getrennt) | Mockup-Formular hat separate Felder statt Freitext-Sammelfeldern. |

Notizen (unverändert ggü. Ultraplan):
- `hunde.mutter_id`/`vater_id` nutzen `on delete set null`, damit der
  30-Tage-Purge einen alten Hund auch dann hart löschen kann, wenn er noch
  als Elternteil referenziert wird. `wuerfe.vater_id` ebenso. Kinder ohne
  eigenständige Bedeutung (Gesundheitschecks, Prüfungen, Würfe→Hunde,
  Verkäufe→Würfe/Käufer) nutzen `on delete cascade`.
- `mutter_id` XOR `mutter_extern_*` (und Vater-Äquivalent) ist weiterhin nur
  Anwendungslogik im Formular, keine DB-Constraint.

### RLS-Policies (Teil von `0001_init_schema.sql`, unverändert ggü. Ultraplan)

```sql
alter table hunde enable row level security;
alter table gesundheitschecks enable row level security;
alter table pruefungen enable row level security;
alter table wuerfe enable row level security;
alter table kaeufer enable row level security;
alter table verkaeufe enable row level security;

-- HUNDE: öffentlich lesbar nur wenn veröffentlicht+nicht gelöscht; authenticated voller Zugriff
create policy hunde_public_select on hunde
  for select to anon, authenticated
  using (veroeffentlicht = true and deleted_at is null);

create policy hunde_auth_all on hunde
  for all to authenticated
  using (true) with check (true);

-- GESUNDHEITSCHECKS: öffentlich lesbar nur wenn der Eltern-Hund veröffentlicht ist
create policy gesundheitschecks_public_select on gesundheitschecks
  for select to anon, authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from hunde h
      where h.id = gesundheitschecks.hund_id
        and h.veroeffentlicht = true and h.deleted_at is null
    )
  );
create policy gesundheitschecks_auth_all on gesundheitschecks
  for all to authenticated using (true) with check (true);

-- PRUEFUNGEN: gleiches Muster
create policy pruefungen_public_select on pruefungen
  for select to anon, authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from hunde h
      where h.id = pruefungen.hund_id
        and h.veroeffentlicht = true and h.deleted_at is null
    )
  );
create policy pruefungen_auth_all on pruefungen
  for all to authenticated using (true) with check (true);

-- WUERFE: öffentlich sichtbar, wenn die Mutter (mutter_id) veröffentlicht ist
create policy wuerfe_public_select on wuerfe
  for select to anon, authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from hunde h
      where h.id = wuerfe.mutter_id
        and h.veroeffentlicht = true and h.deleted_at is null
    )
  );
create policy wuerfe_auth_all on wuerfe
  for all to authenticated using (true) with check (true);

-- KAEUFER / VERKAEUFE: keine public-Policy -> RLS blockt anon komplett
create policy kaeufer_auth_all on kaeufer
  for all to authenticated using (true) with check (true);
create policy verkaeufe_auth_all on verkaeufe
  for all to authenticated using (true) with check (true);
```

Nach Anwendung explizit über `get_advisors` und eine manuelle Smoke-Query mit
dem Anon-Key verifizieren — nicht davon ausgehen, dass Supabase' Default-
`public`-Schema-Grants ausreichen.

### `supabase/migrations/0003_trash_purge_job.sql` — ✅ angewendet

```sql
create extension if not exists pg_cron with schema extensions;

create or replace function public.purge_expired_trash()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from verkaeufe         where deleted_at is not null and deleted_at < now() - interval '30 days';
  delete from gesundheitschecks where deleted_at is not null and deleted_at < now() - interval '30 days';
  delete from pruefungen        where deleted_at is not null and deleted_at < now() - interval '30 days';
  delete from wuerfe            where deleted_at is not null and deleted_at < now() - interval '30 days';
  delete from kaeufer           where deleted_at is not null and deleted_at < now() - interval '30 days';
  delete from hunde             where deleted_at is not null and deleted_at < now() - interval '30 days';
end;
$$;

select cron.schedule('purge-expired-trash', '0 15 * * *', $$select public.purge_expired_trash();$$);
```

**Schedule-Gotcha, der beim Aufsetzen auffiel:** Ein erster Versuch nutzte
`0 0 */30 * *` in der Annahme, das bedeute "alle 30 Tage". Das ist falsch —
`*/30` im Day-of-Month-Feld heißt in Standard-Cron "Schrittweite 30 im
Bereich 1–31", triggert also an Tag 1 und Tag 31 (falls vorhanden), nicht in
festen 30-Tage-Abständen. Supabase' eigene Klartext-Beschreibung im UI
("every 30 days") ist hier irreführend — reine Cron-zu-Text-Näherung, keine
tatsächliche Ausführungssemantik. Aktueller Stand: `0 15 * * *`, läuft
**täglich um 15:00 Uhr UTC** (pg_cron läuft in UTC, nicht Lokalzeit). Die
eigentliche 30-Tage-Aufbewahrung steht ohnehin in der SQL-Funktion selbst
(`deleted_at < now() - interval '30 days'`) — das Schedule bestimmt nur, wie
oft nachgeschaut wird.

Falls `pg_cron`-Scheduling auf dem gewählten Supabase-Plan eingeschränkt
ist: Fallback auf eine Supabase Edge Function mit Cron Trigger, die dieselbe
`purge_expired_trash()`-RPC aufruft — die SQL-Funktion bleibt so oder so,
nur der Trigger-Mechanismus ändert sich.

**Dashboard-Soft-Delete-Muster**: "Löschen" ist immer
`UPDATE ... SET deleted_at = now()`, nie ein echtes `DELETE`. "Wieder-
herstellen" setzt `deleted_at = null`. Die Papierkorb-Ansicht filtert
`deleted_at IS NOT NULL`.

---

## 2a. Supabase Storage — Hundefotos — ✅ live deployed

`hunde.foto_url` darf nie etwas sein, das Oma von Hand eintippt — sie hat
keine Möglichkeit, "ein Bild zu hosten und eine URL zu bekommen". Stattdessen
hält ein Supabase-Storage-Bucket die eigentlichen Dateien, und das Dashboard
lädt direkt dorthin hoch und schreibt die resultierende öffentliche URL
automatisch in `foto_url`.

### `supabase/migrations/0004_storage_bucket.sql`

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hundefotos', 'hundefotos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- jeder (auch anonyme Website-Besucher) kann Fotos lesen — sie erscheinen auf der öffentlichen Seite
create policy hundefotos_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'hundefotos');

-- Dashboard-User dürfen hochladen/ersetzen/löschen. Das Dashboard-Login ist
-- kein echtes Supabase-Auth (AuthProvider.tsx macht nur einen clientseitigen
-- Passwortabgleich, supabaseClient.ts läuft mit persistSession: false) —
-- der Client agiert also immer als Postgres-Rolle `anon`, nie `authenticated`.
-- Deshalb braucht der Bucket zusätzlich zu den authenticated-Policies auch
-- anon-Policies, analog zu ehemalige-fotos.
create policy hundefotos_auth_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'hundefotos');
create policy hundefotos_anon_insert on storage.objects
  for insert to anon
  with check (bucket_id = 'hundefotos');

create policy hundefotos_auth_update on storage.objects
  for update to authenticated
  using (bucket_id = 'hundefotos')
  with check (bucket_id = 'hundefotos');
create policy hundefotos_anon_update on storage.objects
  for update to anon
  using (bucket_id = 'hundefotos')
  with check (bucket_id = 'hundefotos');

create policy hundefotos_auth_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'hundefotos');
create policy hundefotos_anon_delete on storage.objects
  for delete to anon
  using (bucket_id = 'hundefotos');
```

### Behoben: „new row violates row-level security policy" beim Fotoupload

**Symptom war**: Der Hund selbst ließ sich speichern/bearbeiten (Name,
Geburtsdatum etc.), aber beim Klick auf „Foto hochladen" erschien direkt
unter dem Button die Fehlermeldung `new row violates row-level security
policy` — der Upload in `PhotoUpload.tsx`
(`supabase.storage.from('hundefotos').upload(...)`) schlug fehl.

**Ursache**: `hunde` hatte (zusätzlich zu `hunde_auth_all`) eine
`hunde_anon_all`-Policy, wodurch Tabellen-Schreibzugriffe über den
Dashboard-Client — der wegen des rein clientseitigen Passwort-Logins immer
als `anon`-Rolle läuft — funktionierten. Für den `hundefotos`-Bucket gab es
diese anon-Policies für Insert/Update/Delete nicht, nur die
`authenticated`-Varianten oben — daher schlug ausschließlich der
Fotoupload fehl.

**Fix**: `hundefotos_anon_insert`/`_update`/`_delete` (siehe Migration
oben) ergänzt, analog zum bereits für `ehemalige-fotos` verwendeten Muster.
Reine Datenbank-/Storage-Konfigurationsänderung, kein Dashboard-Redeploy
nötig.

- **Bucket**: `hundefotos`, öffentlich lesbar, 5 MB Größenlimit, nur
  JPEG/PNG/WebP — beides serverseitig über die Bucket-Konfiguration
  erzwungen, nicht nur clientseitig validiert.
- **Pfad-Konvention**: ein aktuelles Foto pro Hund unter festem Pfad, z. B.
  `{{hund_id}}/foto.{{ext}}`, Upload mit `{ upsert: true }`. Ein erneuter
  Upload überschreibt immer dasselbe Objekt — kein Problem mit verwaisten
  Dateien, `foto_url` wird nie ungültig.
- **`PhotoUpload.tsx`** (Dashboard-Komponente, in `DogFormPage` genutzt):
  zeigt aktuelles Foto (oder Platzhalter) mit "Foto hochladen"-Button.
  Bei Dateiauswahl: clientseitige Typ-/Größenprüfung, Upload, dann
  `getPublicUrl`, geschrieben in `foto_url`. Kein rohes URL-Textfeld im
  Formular.
- **Website**: keine Änderung nötig — `hund.js`/`hunde.js` rendern
  `foto_url` bereits einfach als `<img src>`.
- **Erstellungsreihenfolge (neuer Hund vs. bestehender)**: der Upload-Pfad
  `{hund_id}/foto.{ext}` braucht eine `hund_id`, die es für einen brandneuen
  Hund noch nicht gibt. Gelöst durch Trennung von `DogFormPage`-Speichern
  und Fotoupload:
  1. Bei neuem Hund ist "Speichern" aktiv, sobald Pflichtfelder (Name,
     Geburtsdatum, Geschlecht) ausgefüllt sind — legt die `hunde`-Zeile
     sofort an (`veroeffentlicht = false` Default, Foto leer), bekommt eine
     echte `id` zurück.
  2. `PhotoUpload` ist mit Hinweis ("Zuerst speichern, dann Foto
     hochladen") deaktiviert, bis diese `id` existiert. Nach dem Speichern
     wechselt die Seite in den "bestehenden Hund bearbeiten"-Zustand (URL
     wird `/hunde/:id/bearbeiten` via Router-Replace, kein Reload), und
     `PhotoUpload` wird an Ort und Stelle aktiv.
  3. Alle späteren Bearbeitungen laufen über dasselbe Formular, bereits im
     "bestehender Hund"-Zustand, `PhotoUpload` ist von Anfang an aktiv.

---

## 3. Supabase-MCP-Provisionierungs-Sequenz — ✅ durchlaufen

1. `list_organizations` — Ziel-Org-ID holen.
2. `get_cost` (neues Projekt) → `confirm_cost` — echte Kosten dem Nutzer vor
   der Bestätigung zeigen, falls nicht Free Tier.
3. `create_project` (Name `boxer-von-tabitha`).
4. `get_project` pollen bis `ACTIVE_HEALTHY`.
5. `apply_migration` → `0001_init_schema.sql` (inkl. RLS-Policies).
6. `apply_migration` → `0003_trash_purge_job.sql`.
7. `apply_migration` → `0004_storage_bucket.sql`.
8. `list_tables` — alle 6 Tabellen + Spalten/FKs verifiziert (siehe
   Screenshot-Abgleich in diesem Chat).
9. Cron-Job verifiziert über Supabase-UI (Integrations → Cron → Jobs).
10. `get_advisors` — keine fehlenden RLS-Policies.
11. `get_project_url` + Anon-Key notiert für `js/config.js` und
    `dashboard/.env`.
12. `generate_typescript_types` → `dashboard/src/types/database.types.ts`.
    **✅ erledigt.**

**Projekt-Referenz:** `https://hemgakjhaqkrrewyzlno.supabase.co`
(project_id: `hemgakjhaqkrrewyzlno`).

`execute_sql` via MCP läuft mit erhöhten Rechten (umgeht RLS) — kein Ersatz
fürs Testen des Anon-Key-Pfads, das passiert erst in Phase 2 mit dem echten
`supabase-js`-Client von echten Seiten aus.

Die drei echten Supabase-Auth-Accounts (Besitzerin + Oma + Tante) sind
**nicht** Teil dieser Sequenz — echte E-Mail-Adressen müssen vom Nutzer
kommen (siehe Abschnitt 8).

**Noch offen aus der ursprünglichen Sequenz:** Platzhalter-Zeilen seeden
(2–3 veröffentlichte Hunde, 1 unveröffentlicht, ein paar Gesundheits-/
Prüfungs-Einträge) — noch nicht gemacht.

---

## 4. Website-Implementierungsdetails

- **`data/posts.json`**: Array aus `{id, title, date, excerpt, body, image}`.
  `js/posts.js` holt, sortiert absteigend nach `date`, rendert in
  `#posts-feed`. Keine Supabase-Abhängigkeit — eigenständig testbar.
- **`js/config.js`**: hartkodierte `SUPABASE_URL`/`SUPABASE_ANON_KEY`.
- **`js/supabase-client.js`**:
  `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`
  in `<script type="module">`.
- **`js/hunde.js`**:
  `supabase.from('hunde').select('*').eq('veroeffentlicht', true).is('deleted_at', null).order('geburtsdatum', {ascending:false})`.
  Alter clientseitig via `js/age.js` berechnet.
- **`js/hund.js`**: liest `id` aus `URLSearchParams`, holt den einzelnen
  veröffentlichten Hund, dann parallel: Eltern-Lookups, plus
  `gesundheitschecks`/`pruefungen` gefiltert nach `hund_id`. Nur eine
  Eltern-Lookup-Ebene für v1.
- **`hund.html`-Tab-Layout**: **Übersicht** (Name, Foto, Alter, Geschlecht,
  "Mutter:"/"Vater:"-Text), **Gesundheit**, **Prüfungen**. Reine CSS/JS-Tabs
  via `js/tabs.js`, togglen `aria-selected`/`hidden`, URL-Hash optional
  (`#gesundheit`).

### Fonts — self-hosted, Sora/Manrope statt Bricolage/Inter

`fonts/{sora,manrope,ibm-plex-mono}/*.woff2` self-hosted, deklariert in
`css/fonts.css` mit `font-display: swap`. **Kein Google-Fonts-CDN-Verweis
irgendwo** (DSGVO-Grund: IP-Übertragung an Google-Server bei CDN-Nutzung,
vgl. OLG-München-Urteil 2022 — daher Self-Hosting statt des ursprünglich im
Claude-Design-Export vorgeschlagenen CDN-Links).

Gewichte: Sora 500/600/700, Manrope 400/500/600/700, IBM Plex Mono 400/500.

### Design-Tokens (`css/tokens.css`)

Ersetzt die ursprüngliche Hex-basierte Platzhalter-Palette durch die vom
Kunden akzeptierte, `oklch()`-basierte Palette (Marken-Akzent: **Sky**),
inklusive vorbereitetem Dark-Mode (aktuell per `prefers-color-scheme` +
`[data-theme]`-Override, manueller Toggle noch nicht implementiert):

```css
:root {
  /* Neutrals — Light */
  --color-bg: oklch(97% 0.008 250);
  --color-surface: oklch(99% 0.004 250);
  --color-border: oklch(90% 0.01 250);
  --color-muted: oklch(52% 0.02 250);
  --color-ink: oklch(22% 0.02 250);

  /* Marken-Akzent: Sky (Hue 220) */
  --color-accent: oklch(90% 0.07 220);
  --color-accent-strong: oklch(80% 0.09 220);
  --color-accent-on-dark: oklch(30% 0.03 220);

  --btn-bg: oklch(80% 0.09 220);
  --btn-text: oklch(20% 0.03 220);
  --card-filled-bg: oklch(93% 0.06 220);
  --shadow-elevated: 0 8px 24px -8px oklch(0% 0 0 / 0.12);

  /* Kategorie-Palette (Status/Tags — Use-Case noch offen) */
  --color-cat-blush: oklch(90% 0.07 8);
  --color-cat-peach: oklch(90% 0.07 55);
  --color-cat-butter: oklch(90% 0.07 95);
  --color-cat-mint: oklch(90% 0.07 150);
  --color-cat-lilac: oklch(90% 0.07 300);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;

  --font-display: 'Sora', sans-serif;
  --font-body: 'Manrope', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --color-bg: oklch(20% 0.015 250);
    --color-surface: oklch(26% 0.015 250);
    --color-border: oklch(36% 0.02 250);
    --color-muted: oklch(68% 0.015 250);
    --color-ink: oklch(93% 0.01 250);
    --color-accent: oklch(60% 0.1 220);
    --color-accent-strong: oklch(58% 0.11 220);
    --color-accent-on-dark: oklch(90% 0.02 220);
    --btn-bg: oklch(58% 0.11 220);
    --btn-text: oklch(97% 0.02 220);
    --card-filled-bg: oklch(32% 0.06 220);
    --shadow-elevated: 0 8px 24px -8px oklch(0% 0 0 / 0.5);
    --color-cat-blush: oklch(40% 0.08 8);
    --color-cat-peach: oklch(40% 0.08 55);
    --color-cat-butter: oklch(40% 0.08 95);
    --color-cat-mint: oklch(40% 0.08 150);
    --color-cat-lilac: oklch(40% 0.08 300);
  }
}

:root[data-theme='dark'] {
  /* identisch zum @media-Block oben, für späteren manuellen Toggle */
}
```

**Offen:** wofür die 5 Kategorie-Farben konkret verwendet werden
(Kandidaten: Gesundheitscheck-Kategorien, Prüfungs-Arten, Trash-Status) —
bewusst noch nicht festgelegt, Vokabular für `kategorie`/`art` bleibt
ohnehin frei (siehe Abschnitt 8).

Browser-Support für `oklch()`: alle Evergreen-Browser (Chrome/Edge 111+,
Safari 15.4+, Firefox 113+), ~93–95 % Abdeckung, kein Fallback vorgesehen —
für dieses private Familientool unkritisch.

- **Partials-System**: `partials.js` holt
  `partials/{header,footer,seal-badge}.html` und injiziert in
  `<div data-partial="header"></div>`-artige Platzhalter bei
  `DOMContentLoaded`.
- **Formspree** (`kontakt.html`):
  `action="https://formspree.io/f/{{FORMSPREE_FORM_ID}}"`, Felder
  Name/E-Mail/Nachricht, verstecktes `_subject`, Honeypot-Feld.
  Platzhalter-ID bis echter Formspree-Account existiert.
- **`impressum.html`**: vollständiges §5-TMG-Strukturlayout jetzt schon,
  Platzhalter-Blöcke klar markiert.
- **`datenschutz.html`**: inhaltlich bereits ausgearbeitet — Formspree
  (US-Transfer-Hinweis), Supabase (EU-Region-Hosting), self-hosted Fonts
  (expliziter Kein-Google-Fonts-Hinweis), aktuell kein Analytics/Tracking.

### Tooling

- **Stylelint**: `stylelint` + `stylelint-config-standard`,
  `.stylelintrc.json` erzwingt kebab-case für CSS-Klassen/-IDs
  (`selector-class-pattern`/`selector-id-pattern`). `npm run lint:css`.
- VS-Code: Extension `stylelint.vscode-stylelint`, `.vscode/settings.json`
  mit Auto-Fix-on-Save, `css.validate: false`.

---

## 5. Dashboard App

**Leitregel**: das Dashboard existiert für genau zwei Bewegungen — *Hunde-
daten eintragen* und *Hundedaten nachschlagen* — weil das, was hier
eingetragen wird, live auf den öffentlichen Tabs des jeweiligen Hundes
erscheint. Jeder Screen sollte daran gemessen werden, "würde Oma hier
wissen, was zu tun ist, ohne zu fragen". Kein Tabellen-Editor, keine
Bulk-Aktionen, keine Einstellungs-Screens außer Login.

- **Build-Tool**: Vite + React + TypeScript (passend zum generierten
  `database.types.ts`). Routing via `react-router-dom`.
- **Auth**: `createClient(url, anonKey, { auth: { persistSession: true,
  autoRefreshToken: true } })`. E-Mail+Passwort-Login (kein Magic Link —
  Magic Link widerspricht dem "bleibt eingeloggt, fühlt sich wie ein
  Passwort an"-Bedürfnis für Oma und Tante). `AuthProvider`-Context via
  `supabase.auth.onAuthStateChange`; `ProtectedRoute` leitet nicht
  eingeloggte Nutzer zu `/login` um. Session-Persistenz verlässt sich auf
  `supabase-js`-localStorage-Defaults — Hinweis im Interface vor Safari
  Private Browsing auf einem ihrer Geräte. Drei echte Auth-Accounts
  (Besitzerin + Oma + Tante), alle mit identischem vollem Zugriff — RLS
  vergibt über die generische `authenticated`-Rolle, nicht pro Nutzer, ein
  dritter Account braucht also keine Schema-/Policy-Änderungen, nur eine
  dritte Zeile in `auth.users` — manuell nach Provisionierung angelegt
  (siehe Abschnitt 8).
- **Lookup-Seite (primärer Screen)**: `DogsListPage` ist die Startseite des
  Dashboards — eine einzige durchsuchbare/filterbare Hundeliste (nach
  Name), jede Zeile zeigt Name/Foto/Alter/Veröffentlicht-Status auf einen
  Blick. Antippen öffnet `DogDetailPage`, die das Tab-Layout der
  öffentlichen Seite spiegelt (Übersicht/Gesundheit/Prüfungen — kein
  Stammbaum-Tab).
- **Eingabe-Seite (Formulare)**:
  - `DogFormPage`: Name, `geburtsdatum`, `geschlecht`, Radio "Mutter in
    Datenbank?" (durchsuchbares Dropdown vs. Freitext-Extern-Felder,
    gespiegelt für Vater), `PhotoUpload`-Widget, `veroeffentlicht`-Toggle
    prominent oben (Default `false`). Ein Screen, kein Wizard —
    `PhotoUpload` deaktiviert bis zum ersten Speichern (siehe 2a).
  - Gesundheitscheck-/Prüfungs-Einträge werden inline aus den Gesundheit-/
    Prüfungen-Tabs von `DogDetailPage` hinzugefügt.
  - `LitterFormPage`, `BuyerFormPage`, `SaleFormPage`: gleiches
    Ein-Screen-pro-Entität-Muster, erreicht von der jeweiligen Hundeseite,
    nicht von der Top-Level-Navigation.
- **Papierkorb-UI**: `/papierkorb`-Route, Tab/Filter pro Entität,
  "Wiederherstellen"-Aktion pro Zeile, verbleibende Tage bis Purge
  angezeigt. Jedes Löschen läuft über einen gemeinsamen
  `ConfirmDeleteDialog`.
- **Responsive**: Sidebar-Nav kollabiert unterhalb ~768px zu Bottom-Tab-
  Bar, ≥44px Touch-Targets fürs iPad, Card-Listen statt dichter Tabellen,
  Wiederverwendung der Marken-Tokens (`styles/tokens.css`, identisch zu
  `css/tokens.css`).

---

## 5a. Admin-Tool-Mockup — ✅ gebaut, Fixes angewendet

Vor dem eigentlichen React-Dashboard wurde ein interaktives HTML/JS-Mockup
gebaut (Bundled-Artefakt mit eigenem Template-Format: `x-dc`/`DCLogic`/
`sc-if`/`sc-for`), um das UI-Verhalten durchzuspielen, bevor Code geschrieben
wird. Es simuliert alle Screens aus Abschnitt 5 mit In-Memory-State (keine
echte DB) — dient als visuelle/interaktive Vorlage für die echten React-
Pages, nicht als Code-Basis zum Kopieren.

**Im Review gefundene und gefixte Bugs:**
- **Mobile-Layout-Bug**: `shell` (Sidebar+Main-Container) hatte kein
  `flex-direction`, dadurch landete die mobile Topbar als schmale Spalte
  neben `main` statt als volle Zeile darüber. Fix: `flex-direction: column`
  wenn `isMobile`.
- **`freetextGrid` fest 2-spaltig**: `grid-template-columns: 1fr 1fr` statt
  `auto-fit`/`minmax(...)` wie die anderen Grids — quetschte Mutter/Vater-
  Name+Zwinger, Wurf-Rüden/Hündinnen, Verkauf-Datum+Preis, Käufer-E-Mail+
  Telefon immer in zwei Spalten, egal wie schmal der Screen. Fix: auf
  `repeat(auto-fit, minmax(150px, 1fr))` geändert.

**Bewusst nicht übernommenes Muster:** Das Mockup simuliert einen
Papierkorb über eine separate `trash`-Liste mit Snapshot-Kopien gelöschter
Objekte (weil es keine echte DB hat). Das ist fragil (kaskadierendes
Löschen verliert Referenzen beim Wiederherstellen) und wird **nicht** 1:1
in die echte App übernommen — dort gilt stattdessen das
`deleted_at`-Soft-Delete-Muster aus Abschnitt 2.

**Noch offene Lücke im Mockup (für die echte `LitterFormPage` nachzutragen):**
Das Mockup erfasst den Wurf-Vater nur als einzelnes Freitextfeld. Das
Schema (`wuerfe.vater_id`/`vater_extern_*`) sieht aber wie bei `hunde` ein
Radio "Vater in Datenbank?" mit Dropdown-Suche vs. Freitext vor — diese
Logik fehlt im Mockup-UI komplett und muss beim Bau der echten
`LitterFormPage` ergänzt werden, sonst geht die Verknüpfung zu Rüden in der
Datenbank verloren.

---

## 6. Build Order / Phasing

**Reihenfolge:** Phase 0 → 1 → **3 → 2** → 4 (ursprünglich 0→1→2→3→4).
Grund: Die Breeder-Nutzerin (Oma) soll so früh wie möglich im Dashboard
Daten eingeben können, statt zu warten, bis auch die statische Website
fertig gegen echte Supabase-Daten verdrahtet ist. Das Dashboard (Phase 3)
hängt an nichts aus Phase 2 — beide hängen nur an Phase 1 (Datenbank) —,
daher ist der Tausch gefahrlos möglich.

**Phase 0 — Statisches Fundament** (keine externen Services): Repo-
Scaffolding, Design-Tokens, self-hosted Fonts, Partials-System, alle
statischen Seiten, funktionierendes `index.html`+`posts.json`+`posts.js`.
*Meilenstein: statische Seite (ohne Live-Hundedaten) visuell komplett, als
Vercel-Preview deploybar.*
**Status: ✅ abgeschlossen** — Stylelint, Tokens/Fonts/Base/Components-CSS,
alle 7 HTML-Seiten + 3 Partials committed. `posts.json`/`posts.js` und
`partials.js`-Injection-Logik: Umsetzungsstand nicht final bestätigt, ggf.
noch zu prüfen/fertigzustellen.

**Phase 1 — Datenbank**: 4 Migrationen schreiben (Schema, RLS, Trash-Purge,
Storage-Bucket), echtes Supabase-Projekt via MCP provisionieren (Abschnitt
3), anwenden, verifizieren, TS-Types generieren, Platzhalter-Zeilen seeden.
*Meilenstein: Supabase-Projekt live, Schema+RLS+Storage sauber verifiziert,
Seed-Daten vorhanden.*
**Status: ✅ Schema+RLS+Cron+Storage+Types erledigt.** Seed-Daten noch offen.

Zusätzlich in Phase 4 ergänzt (eigene Migrationen):
- **`beitraege`-Tabelle**: `id, titel, inhalt, datum, bild_url, veroeffentlicht, deleted_at` — ersetzt `data/posts.json`
- **`ehemalige`-Tabelle**: `id, titel, beschreibung, bilder (text[]), datum, anzahl_welpen, veroeffentlicht, deleted_at` — Freitext-Hundenamen, kein FK zu `hunde`
- **`ehemalige-fotos`-Bucket**: öffentlich, 5 MB, JPEG/PNG/WebP — analog zu `hundefotos`

**Zusatz — Admin-Tool-Mockup**: interaktives Mockup als UI-Vorlage vor dem
React-Bau. **Status: ✅ erledigt** (siehe Abschnitt 5a).

**Phase 3 — Dashboard-App** *(vorgezogen)*: Vite+React-Scaffold, Auth-Flow,
alle CRUD-Seiten/Formulare, `veroeffentlicht`-Toggle, Trash/Restore-UI,
Confirm-Delete-Dialoge, als eigenes Vercel-Projekt deployen. Braucht die
drei echten Auth-Accounts für End-to-End-Login-Tests.
*Meilenstein: Besitzerin, Oma und Tante können alle Daten über geführte
Formulare verwalten; Änderungen spiegeln sich sofort auf der Live-Seite,
kein Rebuild nötig.*
**Status: ✅ erledigt** — `npm run build` sauber (0 TS-Fehler, 102 Module). Alle 10 Seiten, 7 Hooks, 4 geteilte Komponenten, Auth, Router fertig. Branch `feature/phase-3-dashboard`. Drei Supabase-Auth-Konten (Besitzerin, Oma, Tante) noch anzulegen.

**Phase 2 — Website-Live-Daten-Integration** *(nachgezogen)*:
`js/config.js`+`supabase-client.js` ans echte Projekt anschließen;
`hunde.js`/`hund.js`/`age.js` gegen Seed-Daten implementieren/testen;
bestätigen, dass veröffentlichte Hunde erscheinen, unveröffentlichte nicht,
`kaeufer`/`verkaeufe` vom Browser aus unerreichbar sind.
*Meilenstein: öffentliche Website funktional komplett gegen echte
Supabase-Daten, Platzhalter-Inhalte.*
**Status: ✅ erledigt** — Website läuft gegen echte Supabase-Daten auf
https://boxer-vom-hause-tabitha.vercel.app.

**Phase 4 — Media + Ehemaligengalerie**:
Beiträge aus statischem `posts.json` → `beitraege`-Supabase-Tabelle migriert,
`video_url` auf `hunde` ergänzt, `ehemalige`-Tabelle + Storage-Bucket
`ehemalige-fotos` angelegt, Dashboard-Seiten (PostsListPage/FormPage,
EhemaligeListPage/FormPage) + Website `ehemalige.html` (Full-Width-Slider,
Auto-Scroll, Modal) implementiert.
**Status: ✅ erledigt.**

**Phase 5 — Politur & Härtung**: `get_advisors` nach echter Nutzung erneut
laufen lassen, echte Inhalte einsetzen (Fotos, Bio, finale
Impressum-/Datenschutz-Prüfung), `[...]`-Platzhalter in 4 statischen Seiten
füllen, Supabase-Auth-Konten anlegen, `VITE_ADMIN_PASSWORD` ändern.

---

## 7. Verifikation (sobald relevant)

- **Website**: jede statische Seite lokal öffnen (`npx serve`), Posts
  rendern/sortieren bestätigen, `hunde.html` zeigt nur geseedete
  veröffentlichte Hunde, `hund.html?id=<unveröffentlicht>` zeigt einen
  "nicht gefunden"-Zustand (RLS-geblockt), DevTools-Network-Tab zeigt nie
  `kaeufer`/`verkaeufe`-Zeilen für den Anon-Key.
- **Datenbank**: `list_tables` + `get_advisors` sauber; manuelles `select`
  via Anon-Key (z. B. curl mit dem Anon-Key gegen `/rest/v1/kaeufer`) gibt
  leer/403 zurück, beweist dass RLS tatsächlich blockt.
- **Dashboard**: mit allen drei geseedeten Test-Accounts einloggen, einen
  Hund anlegen/bearbeiten/soft-löschen, bestätigen dass er ohne Rebuild auf
  der Live-Seite erscheint/verschwindet, bestätigen dass der Papierkorb ihn
  mit Wiederherstellen-Option zeigt, bestätigen dass permanent abgelaufene
  Papierkorb-Einträge nach manuellem Simulieren der Purge-Funktion weg sind.
- **Fotoupload**: Foto via `PhotoUpload` hochladen, `foto_url`-Update und
  sofortiges Rendern auf `hunde.html`/`hund.html` bestätigen; für denselben
  Hund erneut hochladen und bestätigen, dass das Objekt überschrieben wird
  (kein verwaistes Altobjekt); bestätigen dass eine zu große oder
  Nicht-Bild-Datei mit klarer Meldung abgelehnt wird.

---

## 8. Out of Scope für einen Coding Agent

- Tatsächliche DNS-Umstellung von IONOS zu Vercel (Registrar-Zugang nötig).
- Kauf/Verbindung der Custom-Domains `boxer-von-tabitha.de` und
  `dashboard.boxer-von-tabitha.de` in Vercel.
- Anlegen des echten Formspree-Accounts und der echten Form-Endpoint-ID.
- Schreiben der echten Impressum-Identitätsdaten (Name, Adresse, Kontakt).
- Finales menschliches Sign-off auf `datenschutz.html`-Inhalt vor
  Veröffentlichung.
- Beschaffen echter Hundefotos und echten Züchterin-Bio-Texts.
- Anlegen der drei echten Supabase-Auth-Accounts mit echten
  E-Mail-Adressen/Passwörtern für Besitzerin + Oma + Tante.
- Plan-/Billing-Tier-Entscheidungen für Supabase oder Vercel über Free Tier
  hinaus.
- Entscheidung über das tatsächliche Vokabular in
  `gesundheitschecks.kategorie`/`ergebnis` und `pruefungen.art`/`ergebnis`
  jenseits von "Freitext bleibt Freitext" — Inhaltsentscheidung der
  Züchterin.

**Was JETZT mit Platzhaltern gebaut werden kann**: das gesamte
Schema/RLS/Purge-Job gegen ein echtes provisioniertes Supabase-Projekt
(✅ erledigt); die komplette öffentliche Website mit Platzhalter-Fotos/Bio/
Posts; die komplette Dashboard-App voll funktional gegen echtes
(Platzhalter-Daten-)Supabase; Formspree an einen Platzhalter-/Test-Endpoint
verdrahtet; Impressum/Datenschutz strukturell komplett mit Platzhalter-
Blöcken nur für Identitätsdaten.

---

## Anhang: Korrekturen während der Umsetzung (Phase 0)

- `partials/` enthielt versehentlich vier vollständige Seiten
  (`datenschutz.html`, `impressum.html`, `kontakt.html`,
  `ueber-mich.html`) statt nur der drei Fragmente — korrigiert.
- `hund.html` fehlte zunächst komplett, wurde nachträglich ergänzt.
- Ein unabhängiges Claude-Design-Testprojekt (Angular-basiert,
  `@pax-product/pax-ui`) landete versehentlich im Home-Verzeichnis statt
  in einem eigenen Ordner — betrifft `boxer-von-tabitha` nicht.
