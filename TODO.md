Aplikacja nodejs interactions ma za zadanie polaczyc javascript z plikami SVG w celu obslugiwaniu akcje w czasie rzeczywistym, 
takie jak klikniecie,  na bazie 
wczesniej wygenerowane i wyeksportowanego canva SVG, ktory finalnie bedzie czescia pliku html do pliku svg 
Rezultatem dzialania projektu interactions ma byc gotowy plik html z interakcjami w czasie rzeczywistym eksportowany jako strona html

Dlatego przygotuj plik html jako canva dla interactions, gdzie bedzie mozliwe
zaimportowanie np dwoch roznych canva z pliku SVG, ktore beda obslugiwane przez akcje w czasie rzeczywistym za pomoca jezyka JS
ktory bedzie czescia tego pliku html, poprzez tagi <script> i <svg>
Celem interactions jest polaczenie plikow SVG z JS w celu stworzenia interaktywnegj strony html z obsluga wszystkich akcji w czasie rzeczywistym
Aby to bylo mozliwe, nalezy stworzyc IDE, z lewą kolumną dla dostepnych zasobów, czyli plikow 
.svg, .js, ktore mozna polaczyc w jednym pliku html
kazdy plik .js powinien zawierac sie w tagach script, ktory bedzie obslugiwal akcje i widoki z svg i pozwalal na modyfikowanie widoku SVG np porzez zmiane wartosci XML w metadata 
metadata powinna byc aktualizowana w czasie rzeczywistym a wewnetrzny skrypt componentu wlaczonego w SVG bedzie obslugiwal zmiany w metadata danego componentu wbudowanego w canva svg w czasie rzeczywistym

po prawej stronie IDE bedzie kolumna własciwosci z mozliwosciami do edycji SVG i SVG 
W centrum będzie 


