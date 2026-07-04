# Jak samemu edytować notatki

## Setup (raz)

Folder `content/` **jest już vaultem Obsidiana**. W Obsidianie:
**Open folder as vault → wybierz `…/quartz-farmakologia/content`**.

To wszystko. Edytujesz `.md` w Obsidianie (albo dowolnym edytorze).

## Jak działa update strony

Serwer Quartza chodzi jako usługa systemd i **obserwuje folder `content/`**:

1. Zapisujesz plik (`Ctrl+S`).
2. Quartz sam przebudowuje zmienioną stronę (kilka sekund).
3. Zakładka `http://localhost:8080` **odświeża się sama** (hot-reload).

**Nie musisz nic restartować** przy edycji treści. Restart potrzebny tylko przy zmianie: `quartz.config.ts`, pluginów w `quartz/`, albo stylów `.scss`:

```bash
systemctl --user restart quartz-farmakologia
systemctl --user status  quartz-farmakologia    # podgląd
journalctl --user -u quartz-farmakologia -f      # log na żywo
```

## Mapa plików

| Plik / folder | Co to |
|---|---|
| `content/index.md` | Strona główna „Pharmacology Masterrace" |
| `content/mastersheet.md` | Mastersheet — sekcje + tabele leków |
| `content/sekcje/<temat>.md` | Notatka sekcji (lista leków + link do pytań) |
| `content/leki/<lek>.md` | Notatka pojedynczego leku |
| `content/pytania/<temat>.md` | Pytania (quizy) dla sekcji |
| `pytania-reference.md` (root repo) | Robocza baza wszystkich pytań (niepublikowana) |
| `public/` | **Wygenerowane HTML — NIE edytować** |

## Ściąga składni (tak piszemy w tym projekcie)

**Link do leku / sekcji** (nazwa pliku bez `.md`):
```
[[leki/morfina|Morfina]]        albo krótko  [[morfina]]
[[sekcje/opioidy|Opioidy]]
```

**Link w komórce tabeli** — trzeba uciec `|` jako `\|`:
```
| [[leki/morfina\|Morfina]] | [[leki/fentanyl\|Fentanyl]] |
```

**Callouty:**
```
> [!info] Tytuł
> [!tip] ...
> [!warning] ...
> [!success]- Zwijany (myślnik = domyślnie zwinięty)
```

**Interaktywny quiz** (`+` = poprawna, `-` = błędna, pierwsza linia = treść):
````
```quiz
Anastrozol to:
- antagonista estrogenowy
- kompetycyjny inhibitor aromatazy
+ odpowiedzi A i D są prawidłowe
```
````
(interaktywne tylko na stronie; w Obsidianie widać zwykły blok kodu)

**Wzór chemiczny 2D** (SMILES):
````
```smiles
CN1CC[C@]23c4c5ccc(O)c4O[C@H]2[C@@H](O)C=C[C@H]3[C@H]1C5
```
````

## Typowe zadania

**Dodać treść do leku:** otwórz `content/leki/<lek>.md`, wypełnij sekcje (Mechanizm, Wskazania…). Zapisz.

**Dodać nowy lek:** utwórz `content/leki/<slug>.md` (slug = małe litery, bez polskich znaków, spacje→`-`, np. `kwas-foliowy`). Dodaj `- [[leki/<slug>|Nazwa]]` w odpowiednim pliku `sekcje/…`.

**Dodać pytanie:** w `content/pytania/<temat>.md` dopisz nagłówek `### Pytanie N · [[lek]]`, pod nim blok ` ```quiz `, na końcu `---`.

**Rozdzielić sekcje:** linia `---` w pustym wierszu.

## Uwagi

- Obsidian sam aktualizuje linki przy zmianie nazwy pliku — wygodne.
- Nie edytuj `public/` ani `.quartz-cache/` (generowane).
- `pytania-reference.md` jest poza vaultem `content/` (żeby się nie publikował) — otwórz go zwykłym edytorem albo przenieś do `content/` z `draft: true` w frontmatterze, jeśli chcesz mieć w Obsidianie.
