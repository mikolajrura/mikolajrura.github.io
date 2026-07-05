# molecule-embeds — problemy do naprawy (na później)

Notatki z analizy repo [`mikolajrura/molecule-embeds`](https://github.com/mikolajrura/molecule-embeds)
(wtyczka Obsidian; jej port do Quartza żyje w `quartz/plugins/transformers/molecules.ts`).

## 1. Release nie zawiera plików RDKit — instalka się wywala
- `.github/workflows/release.yml` publikuje tylko `main.js`, `manifest.json`, `styles.css`.
- `install.sh` próbuje pobrać dodatkowo `RDKit_minimal.js` i `RDKit_minimal.wasm`
  z `releases/latest/download/...`, ale ich tam nie ma → `curl` zwraca `✗`.
- **Skutek:** świeża instalacja przez `install.sh` daje wtyczkę bez silnika RDKit
  (nic się nie renderuje).
- **Fix:** dodać `RDKit_minimal.js RDKit_minimal.wasm` do listy plików w `gh release create`.

## 2. Mylący komunikat błędu — „Check your internet connection"
- `src/main.ts` przy błędzie ładowania RDKit pokazuje
  „Failed to load RDKit. Check your internet connection.".
- WASM jest ładowany **lokalnie z dysku** (`fs.readFileSync`), więc internet nie ma
  z tym nic wspólnego. README wręcz reklamuje „no internet required".
- **Fix:** zmienić treść na coś w stylu „Failed to load RDKit (missing local files?)".

## 3. Martwy / nieużywany kod w `src/types.ts`
- `enum ViewMode` (Skeletal / SemiStructural / Structural) oraz interfejs `DrawOptions`
  nie są nigdzie importowane ani używane w rendererze.
- Wygląda na przygotowanie pod przełączanie trybów widoku, którego nie zaimplementowano.
- **Fix:** albo zaimplementować przełącznik trybów, albo usunąć martwy kod.

## 4. Niespójność nazewnictwa wtyczki
- Klasa w `src/main.ts` nazywa się `MoleculeViewerPlugin`, a komenda to „Open molecule viewer".
- `manifest.json` / `README.md` używają nazwy „Molecule Embeds".
- `install.sh` na końcu pisze „enable Molecule Viewer" — kolejna wariacja.
- **Fix:** ujednolicić nazwę (Molecule Embeds) w kodzie, komendzie i komunikatach.

## 5. (kosmetyka) Kolory pod czarne tło
- Paleta atomów i wiązań jest dobrana pod czarne tło (węgiel = biały).
- Przy przezroczystym / jasnym tle białe wiązania będą niewidoczne.
- Warto zrobić kolory zależne od motywu (light/dark) — patrz zmiana tła w Quartzu.
