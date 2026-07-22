# PSIP Tracker

System zarządzania pracami — Podkarpackie Biuro Geodezji i Terenów Rolnych.

Aplikacja: **https://psippbgitr.github.io/psip-tracker/**

## Dokumentacja dla użytkowników

- [Instrukcja dla pracowników](instrukcja_psip_tracker_zespol.pdf)

## Co jest w tym repozytorium

Wyłącznie część działająca w przeglądarce:

| plik | rola |
|---|---|
| `index.html` | cała aplikacja — widoki, logika, style |
| `sw.js` | Service Worker: praca offline i instalacja na telefonie |
| `manifest.json` | dane aplikacji instalowanej na ekranie głównym |
| `version.json` | numer wersji; jego podbicie wywołuje u wszystkich baner „dostępna nowa wersja" |
| `icon-*.png`, `logowanielewe.jpg` | grafika |

## Czego tu NIE ma — i dlaczego

**Kodu backendu.** Backend to Google Apps Script podpięty do arkusza z danymi;
jego źródło żyje wyłącznie w edytorze Apps Script. Wcześniej leżała tu kopia
pliku `Code.gs`, która z czasem rozjechała się z tym, co faktycznie działało na
produkcji — brakowało w niej połowy obsługiwanych akcji, a zawierała funkcje,
które nigdy nie zostały wdrożone. Trzymanie nieaktualnej kopii backendu obok
aktualnego frontendu jest gorsze niż nietrzymanie jej wcale, bo prędzej czy
później ktoś na niej oprze zmianę.

## Przy każdym wdrożeniu nowej wersji

Trzy pliki muszą mieć zgodny numer wersji, inaczej zespół albo nie zobaczy
banera o aktualizacji, albo zostanie ze starą powłoką w pamięci przeglądarki:

1. `APP_VERSION` w `index.html`
2. `version` w `version.json`
3. `CACHE_NAME` w `sw.js`

## Uwierzytelnianie

Aplikacja jest publiczna, ale dane nie. Logowanie odbywa się PIN-em
weryfikowanym po stronie serwera na nieodwracalnym skrócie; sesję nosi
podpisany token ważny 30 dni. Bez zalogowania endpoint nie oddaje żadnych
danych — publiczna jest wyłącznie lista kont na ekran logowania (imię, rola,
inicjały) i motto dnia.

**Żadne hasło, PIN ani klucz nie mogą trafić do tego repozytorium.** Jest
publiczne, a historia gita pamięta wszystko, co raz do niej trafiło — nawet po
usunięciu z bieżącej wersji.
