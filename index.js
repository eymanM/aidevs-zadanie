const express = require('express');
const fs = require('fs');
const path = require('path'); // Potrzebne do ścieżek plików

const app = express();
const port = process.env.PORT || 3000; // Użyj portu z env lub domyślnie 3000

// Wczytaj dane z plików JSON przy starcie serwera
let osobyData = [];
let uczelnieData = [];
let badaniaData = [];

try {
    osobyData = JSON.parse(fs.readFileSync(path.join(__dirname, 'osoby.json'), 'utf8'));
    uczelnieData = JSON.parse(fs.readFileSync(path.join(__dirname, 'uczelnie.json'), 'utf8'));
    badaniaData = JSON.parse(fs.readFileSync(path.join(__dirname, 'badania.json'), 'utf8'));
    console.log("Dane JSON załadowane pomyślnie.");
} catch (error) {
    console.error("Błąd podczas wczytywania plików JSON:", error);
    // Można tu dodać logikę zatrzymania serwera lub obsługi błędu
}


app.use(express.json()); // Middleware do parsowania JSON w body requestu

// --- Endpoint 1: Znajdowanie informacji o badaniu (Tool 1) ---
app.post('/findResearch', (req, res) => {
    const searchTerm = req.body.input; // Parametr wyszukiwania od agenta

    // Weryfikacja webhooka
    if (typeof searchTerm === 'string' && searchTerm.startsWith('test')) {
        console.log(`Otrzymano weryfikację: ${searchTerm}`);
        return res.json({ output: searchTerm });
    }

    console.log(`Otrzymano zapytanie /findResearch z params: ${searchTerm}`);

    // Sprawdzenie, czy parametr wyszukiwania został podany
    if (!searchTerm || typeof searchTerm !== 'string') {
        console.log("Brak parametru 'params' lub nie jest stringiem.");
        return res.status(400).json({ output: "Błąd: Oczekiwano parametru 'params' typu string w ciele żądania." });
    }

    // Logika wyszukiwania badania w polu 'nazwa' (case-insensitive)
    const foundResearch = badaniaData.filter(b =>
        b.nazwa.toLowerCase().includes(searchTerm.toLowerCase())
    );

    let outputData;
    if (foundResearch.length > 0) {
        // Zwracamy informacje o znalezionych badaniach (może być więcej niż jedno)
        // Dla zwięzłości zwrócimy tylko pierwsze znalezione lub listę
        // Przykład dla pierwszego znalezionego:
        const firstResult = foundResearch[0];
        outputData = `Znaleziono badanie pasujące do "${searchTerm}": "${firstResult.nazwa}". ID Uczelni: ${firstResult.uczelnia}, Sponsor: ${firstResult.sponsor}`;
        // Można też zwrócić listę, jeśli agent ma sobie poradzić z wieloma wynikami:
        // outputData = foundResearch.map(r => `Badanie: "${r.nazwa}", UczelniaID: ${r.uczelnia}, Sponsor: ${r.sponsor}`).join(' | ');

    } else {
        outputData = `Nie znaleziono badania zawierającego "${searchTerm}" w nazwie.`;
    }

    // Ograniczenie długości odpowiedzi
    if (outputData.length > 1024) {
        outputData = outputData.substring(0, 1021) + "...";
    }

    console.log(`Odpowiedź /findResearch: ${outputData}`);
    res.json({ output: outputData });
});

app.post('/findTeamAndUni', (req, res) => {
    const universityId = req.body.input;

    // Weryfikacja webhooka
    if (typeof universityId === 'string' && universityId.startsWith('test')) {
        console.log(`Otrzymano weryfikację: ${universityId}`);
        return res.json({ output: universityId });
    }

    console.log(`Otrzymano zapytanie /findTeamAndUni z params: ${universityId}`);

    if (!universityId || typeof universityId !== 'string') {
        console.log("Brak parametru 'params' lub nie jest stringiem.");
        return res.status(400).json({ output: "Błąd: Oczekiwano ID uczelni jako 'params' typu string." });
    }

    let universityName = "Nie znaleziono uczelni o podanym ID.";
    let teamMembers = [];

    // Znajdź nazwę uczelni
    const foundUniversity = uczelnieData.find(u => u.id === universityId);
    if (foundUniversity) {
        universityName = foundUniversity.nazwa;
    }

    // Znajdź członków zespołu (osoby z danej uczelni)
    teamMembers = osobyData
        .filter(o => o.uczelnia === universityId)
        .map(o => `${o.imie} ${o.nazwisko}`);

    let outputData = `Uczelnia (ID: ${universityId}): ${universityName}. `;
    if (teamMembers.length > 0) {
        outputData += `Członkowie zespołu: ${teamMembers.join(', ')}.`;
    } else {
        outputData += "Brak danych o członkach zespołu dla tej uczelni.";
    }

     // Ograniczenie długości odpowiedzi
    if (outputData.length > 1024) {
        outputData = outputData.substring(0, 1021) + "...";
    }

    console.log(`Odpowiedź /findTeamAndUni: ${outputData}`);
    res.json({ output: outputData });
});

// Uruchomienie serwera
app.listen(port, () => {
    console.log(`Serwer API nasłuchuje na porcie ${port}`);
    console.log('Dostępne endpointy:');
    console.log(`POST /findResearch`);
    console.log(`POST /findTeamAndUni`);
});