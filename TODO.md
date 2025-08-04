# Digital Twin Interactions - Lista zadań (TODO)

## Główne cele projektu [✓]
Aplikacja nodejs interactions ma za zadanie polaczyc javascript z plikami SVG w celu obslugiwaniu akcje w czasie rzeczywistym, 
takie jak klikniecie, na bazie 
wczesniej wygenerowane i wyeksportowanego canva SVG, ktory finalnie bedzie czescia pliku html do pliku svg 
Rezultatem dzialania projektu interactions ma byc gotowy plik html z interakcjami w czasie rzeczywistym eksportowany jako strona html

> **Translation:** The Node.js interactions application aims to connect JavaScript with SVG files to handle real-time actions like clicks, based on previously generated and exported SVG canvas, which will finally be part of an HTML file. The result should be a ready-to-use HTML file with real-time interactions.

## Funkcjonalności IDE [✓]
Dlatego przygotuj plik html jako canva dla interactions, gdzie bedzie mozliwe
zaimportowanie np dwoch roznych canva z pliku SVG, ktore beda obslugiwane przez akcje w czasie rzeczywistym za pomoca jezyka JS
ktory bedzie czescia tego pliku html, poprzez tagi <script> i <svg>
Celem interactions jest polaczenie plikow SVG z JS w celu stworzenia interaktywnegj strony html z obsluga wszystkich akcji w czasie rzeczywistym

> **Translation:** Prepare an HTML file as a canvas for interactions, where it will be possible to import multiple different SVG canvases, which will be handled by real-time actions using JavaScript that will be part of the HTML file via `<script>` and `<svg>` tags.

## Układ IDE [✓]
Aby to bylo mozliwe, nalezy stworzyc IDE, z lewą kolumną dla dostepnych zasobów, czyli plikow 
.svg, .js, ktore mozna polaczyc w jednym pliku html
kazdy plik .js powinien zawierac sie w tagach script, ktory bedzie obslugiwal akcje i widoki z svg i pozwalal na modyfikowanie widoku SVG np porzez zmiane wartosci XML w metadata 
metadata powinna byc aktualizowana w czasie rzeczywistym a wewnetrzny skrypt componentu wlaczonego w SVG bedzie obslugiwal zmiany w metadata danego componentu wbudowanego w canva svg w czasie rzeczywistym

po prawej stronie IDE bedzie kolumna własciwosci z mozliwosciami do edycji SVG i script po nacisniejcu w c centrum 
po lewej są pliki dodane do IDE w celu stworzenia interaktywnego pliku html z obsluga akcji w czasie rzeczywistym
W centrum mamy 2 taby, jeden do podgladu preview, a drugi do edycji kodu 

> **Translation:** Create an IDE with a left column for available resources (.svg, .js files), which can be combined in one HTML file. Each .js file should be contained in script tags to handle actions and SVG views, allowing modification of the SVG view by changing XML values in metadata. The metadata should be updated in real-time. On the right side of the IDE will be a properties column for editing SVG and scripts. In the center are 2 tabs: one for preview and one for code editing.

## Dodatkowe funkcjonalności [✓]
Zaproponuj lepsze rozwiazanie, jesli jest mozliwe, aby mozna bylo dopasowac skrypt do jednego lub kilku elementow component znajdujacych sie na zaladowanych SVG
podaj przykald z html zawierajacycm 2x canva svg wygenerowane wczesniej z mozliwoscia podgladu jako makiety cyfrowe sprzetu i dzialajace z API oraz pokazujace dane w SVG i 
pozwalajace na wizualziacje pracy i sterowanie poprzez makiety SVG z dodatkowymi skryptami w kodzie html,

> **Translation:** Propose a better solution for matching scripts to one or more component elements in loaded SVGs, and provide an example HTML with 2 SVG canvases generated earlier, with preview capability as digital equipment mockups, working with API and displaying data in SVG.

## Wizualizacja i interakcje [✓]
jak mozna zwizualizowac te JS skrypty, aby można by ło je łatwo dopasować do inetarakcji i dopisać kod? 
ale też żeby doziwerciedlały interakcje wszystkich elementow w ramach pliku html zawierajacych kilka SVG i kilka script

> **Translation:** How to visualize JS scripts for easy matching to interactions and adding code, while also reflecting interactions of all elements within the HTML file containing multiple SVGs and scripts.

## GUI dla IDE [✓]
Zaproponuj GUI dla IDE

> **Translation:** Propose a GUI for the IDE.

## Zmiany w menu [✓]
zmiany w menu: zamiast modal-content użyj dodatkowych buttonow w menu, aby bezposrednio zapisac lub preview plik html 

> **Translation:** Changes in the menu: instead of modal-content, use additional buttons in the menu to directly save or preview the HTML file.

## Rozwiązane błędy [✓]
przy generowaniu pliku html na podstawie pliku SVG i skryptu JS, pojawia sie blad w przegladarkce logs
app.js:323 Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')
at HTMLDocument.<anonymous> (app.js:323:18)

> **Note:** This error has been fixed by correcting element ID mismatches between the HTML and JavaScript files.

## Zadania wykonane dodatkowo [✓]
1. Responsywny design mobilny
2. Ładowanie przykładowych plików z katalogu 'examples'
3. Naprawienie błędów JavaScript (redeclaration, null references)
4. Optymalizacja kodu pod kątem wydajności
5. Poprawa interfejsu użytkownika
