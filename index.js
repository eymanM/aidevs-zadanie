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
     const inputForVerification = req.body.input; // Dla weryfikacji
     const searchTerm = req.body.params; // Parametr wyszukiwania od agenta

    // Weryfikacja webhooka (używa pola 'input')
    if (typeof inputForVerification === 'string' && inputForVerification.startsWith('test')) {
        console.log(`Otrzymano weryfikację: ${inputForVerification}`);
        return res.json({ output: inputForVerification });
    }
    /// Another webhook verification check
    if (typeof searchTerm === 'string' && searchTerm.startsWith('test')) {
        console.log(`Otrzymano weryfikację: ${searchTerm}`);
        return res.json({
            action: "answer",
            value: "answer",
            params: searchTerm
        });
    }

    console.log(`Otrzymano zapytanie /findResearch z params: ${searchTerm}`);

    // Check if search parameter was provided
    if (!searchTerm || typeof searchTerm !== 'string') {
        console.log("Brak parametru 'params' lub nie jest stringiem.");
        return res.status(400).json({
            action: "answer",
            value: "answer",
            params: "Błąd: Oczekiwano parametru 'params' typu string w ciele żądania."
        });
    }

    // Find research by name (case-insensitive)
    const foundResearch = badaniaData.filter(b =>
        b.nazwa.toLowerCase().includes(searchTerm.toLowerCase())
    );

    let outputData;
    if (foundResearch.length > 0) {
        const firstResult = foundResearch[0];
        outputData = `Znaleziono badanie pasujące do "${searchTerm}": "${firstResult.nazwa}". ID Uczelni: ${firstResult.uczelnia}, Sponsor: ${firstResult.sponsor}`;
    } else {
        outputData = `Nie znaleziono badania zawierającego "${searchTerm}" w nazwie.`;
    }

    // Limit response length
    if (outputData.length > 1024) {
        outputData = outputData.substring(0, 1021) + "...";
    }

    console.log(`Odpowiedź /findResearch: ${outputData}`);
    
    // Return the correct format with "answer" action since we're providing the final result
    res.json({
        action: "usetool",
        value: "tool1",
        params: outputData
    });
});

app.post('/findTeamAndUni', (req, res) => {
     const inputForVerification = req.body.input; // Dla weryfikacji
     const universityId = req.body.params; // Oczekujemy ID uczelni w params

    // Weryfikacja webhooka
    if (typeof inputForVerification === 'string' && inputForVerification.startsWith('test')) {
        console.log(`Otrzymano weryfikację: ${inputForVerification}`);
        return res.json({ output: inputForVerification });
    }

    // Another webhook verification check
    if (typeof universityId === 'string' && universityId.startsWith('test')) {
        console.log(`Otrzymano weryfikację: ${universityId}`);
        return res.json({
            action: "answer",
            value: "answer",
            params: universityId
        });
    }

    console.log(`Otrzymano zapytanie /findTeamAndUni z params: ${universityId}`);

    if (!universityId || typeof universityId !== 'string') {
        console.log("Brak parametru 'params' lub nie jest stringiem.");
        return res.status(400).json({
            action: "answer",
            value: "answer",
            params: "Błąd: Oczekiwano ID uczelni jako 'params' typu string."
        });
    }

    let universityName = "Nie znaleziono uczelni o podanym ID.";
    let teamMembers = [];

    // Find university name
    const foundUniversity = uczelnieData.find(u => u.id === universityId);
    if (foundUniversity) {
        universityName = foundUniversity.nazwa;
    }

    // Find team members (people from the university)
    teamMembers = osobyData
        .filter(o => o.uczelnia === universityId)
        .map(o => `${o.imie} ${o.nazwisko}`);

    let outputData = `Uczelnia (ID: ${universityId}): ${universityName}. `;
    if (teamMembers.length > 0) {
        outputData += `Członkowie zespołu: ${teamMembers.join(', ')}.`;
    } else {
        outputData += "Brak danych o członkach zespołu dla tej uczelni.";
    }

    // Limit response length
    if (outputData.length > 1024) {
        outputData = outputData.substring(0, 1021) + "...";
    }

    console.log(`Odpowiedź /findTeamAndUni: ${outputData}`);
    
    // Return the correct format with "answer" action since we're providing the final result
    res.json({
        action: "usetool",
        value: "tool1",
        params: outputData
    });
});

// Uruchomienie serwera
app.listen(port, () => {
    console.log(`Serwer API nasłuchuje na porcie ${port}`);
    console.log('Dostępne endpointy:');
    console.log(`POST /findResearch`);
    console.log(`POST /findTeamAndUni`);
});
