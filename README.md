# GUI_Mate_2025


## Node Modules
```
├── electron@39.2.6
└── react@19.2.1
```

## Projekt Leírás

Ez a projekt egy interaktív grafikus felületet valósít meg, amely egy helyiség alaprajzát ábrázoló előre meghatározott .jpg képfájlt használ háttérként. A felületen különböző eszközök állapotát szimbolizáló ikonok helyezkednek el, amelyek az eszközök aktuális állapotától függően változnak.

### Fő Funkciók

1. **Alaprajz háttér**
   - Egy előre kiválasztott .jpg képfájl jeleníti meg a helyiség alaprajzát.

2. **Interaktív ikonok**
   - Az alaprajzon eszközöket szimbolizáló ikonok jelennek meg.
   - Minden eszköztípushoz háromféle (zöld: bekapcsolt, piros: kikapcsolt, szürke: offline) 128x128 px átlátszó hátterű .ico ikon tartozik.
   - Az ikonok állapota 1 másodperces frissítéssel automatikusan változik.

3. **Ikon interakciók**
   - Az ikon fölé húzva az egeret, megjelenik az eszköz neve.
   - Jobb egérgombbal kattintva menü jelenik meg: bekapcsolás, kikapcsolás, információ.
   - Bekapcsolás/kikapcsolás: relé kimenet vezérlése.
   - Információ: eszköz adatai külön ablakban.

4. **Beállítások menü**
   - Háttérkép kiválasztása.
   - Új eszköz hozzáadása (IP, név, ikon stb.), majd az ikon szabadon pozícionálható a képen.
   - Az ikonok helyzete elmenthető, később már nem mozgatható.
   - A kép és ikonok arányos elhelyezése fix vagy dinamikus méretezéssel.

5. **Rutin menü**
   - Ki- és bekapcsolási időzítések, órához rendelt parancsok létrehozása.
   - Rutinok szerkesztése, meglévő rutinok áttekintése.

## Telepítés és futtatás

1. Telepítsd a függőségeket:
   ```
   npm install
   ```
2. Indítsd el a projektet:
   ```
   npm start
   ```
3. Build készítése:
   ```
   npm run build
   ```

## Fájlok
- `index.html` – Az alkalmazás fő HTML fájlja
- `main.js` – Az alkalmazás fő JavaScript logikája
- `package.json` – Projekt metaadatok és függőségek

## Szerző
- Készítette: [Kugli Balázs]
- Dátum: 2025. december
