// 1. ADATSTRUKTÚRÁK (Magyar megnevezésekkel)
const NOVENYEK = {
    buza: { nev: "Búza", ikon: "🌾", ido: 5, xp: 5, eladasiAr: 10 },
    repa: { nev: "Répa", ikon: "🥕", ido: 10, xp: 12, eladasiAr: 25 },
    paradicsom: { nev: "Paradicsom", ikon: "🍅", ido: 18, xp: 20, eladasiAr: 50 }
};

const ALLAT_BEALLITASOK = {
    csirke: { nev: "Csirke", ikon: "🐔", termelesIdo: 8, termek: "Tojás 🥚", ar: 50, eladasiAr: 15 },
    tehen: { nev: "Tehén", ikon: "🐮", termelesIdo: 15, termek: "Tej 🥛", ar: 150, eladasiAr: 40 }
};

// Globális Játékállapot
let FARM_ADATOK = {
    arany: 100,
    xp: 0,
    jatekIdoPercben: 8 * 60, // 08:00 kezdés
    raktar: { buza: 2, repa: 0, paradicsom: 0, tojas: 0, tej: 0 },
    foldek: [
        { id: 0, allapot: 'ures', noveny: null, szamlalo: 0, megontozve: false },
        { id: 1, allapot: 'ures', noveny: null, szamlalo: 0, megontozve: false },
        { id: 2, allapot: 'ures', noveny: null, szamlalo: 0, megontozve: false },
        { id: 3, allapot: 'ures', noveny: null, szamlalo: 0, megontozve: false },
        { id: 4, allapot: 'ures', noveny: null, szamlalo: 0, megontozve: false },
        { id: 5, allapot: 'ures', noveny: null, szamlalo: 0, megontozve: false }
    ],
    allatok: []
};

let kivalasztottFoldId = null;

// DOM Elemek
const vaszon = document.getElementById('farm-vaszon');
const kontextus = vaszon.getContext('2d');

// 2. CANVAS RAJZOLÁS (Földparcellák)
function foldekKirajzolasa() {
    kontextus.clearRect(0, 0, vaszon.width, vaszon.height);
    
    const oszlopok = 3;
    const szelesseg = 160;
    const magassag = 100;
    const hely = 20;
    const kezdoX = (vaszon.width - (oszlopok * szelesseg + (oszlopok - 1) * hely)) / 2;
    const kezdoY = 50;

    FARM_ADATOK.foldek.forEach((fold, index) => {
        const sor = Math.floor(index / oszlopok);
        const oszlop = index % oszlopok;
        const x = kezdoX + oszlop * (szelesseg + hely);
        const y = kezdoY + sor * (magassag + hely);

        fold.x = x; fold.y = y; fold.w = szelesseg; fold.h = magassag;

        // Háttérszín beállítása az állapottól függően
        if (fold.allapot === 'ures') kontextus.fillStyle = '#8d5524';
        else if (fold.allapot === 'szantott') kontextus.fillStyle = '#5c3a21';
        else if (fold.allapot === 'no') kontextus.fillStyle = fold.megontozve ? '#3d2314' : '#5c3a21';
        else if (fold.allapot === 'kesz') kontextus.fillStyle = '#27ae60';

        kontextus.fillRect(x, y, szelesseg, magassag);
        kontextus.strokeStyle = '#fff';
        kontextus.lineWidth = 2;
        kontextus.strokeRect(x, y, szelesseg, magassag);

        // Szöveg és Ikonok
        kontextus.fillStyle = 'white';
        kontextus.font = '16px Arial';
        kontextus.textAlign = 'center';

        if (fold.allapot === 'ures') {
            kontextus.fillText("Kattints a szántáshoz", x + szelesseg/2, y + magassag/2);
        } else if (fold.allapot === 'szantott') {
            kontextus.fillText("Szántva! (Kattints a vetéshez)", x + szelesseg/2, y + magassag/2);
        } else if (fold.allapot === 'no') {
            const n = NOVENYEK[fold.noveny];
            kontextus.fillText(`${n.ikon} ${fold.szamlalo}s`, x + szelesseg/2, y + magassag/2 - 10);
            kontextus.fillText(fold.megontozve ? "💧 Megöntözve" : "Kattints az öntözéshez!", x + szelesseg/2, y + magassag/2 + 15);
        } else if (fold.allapot === 'kesz') {
            kontextus.fillText(`${NOVENYEK[fold.noveny].ikon} Aratásra kész!`, x + szelesseg/2, y + magassag/2);
        }
    });
}

// 3. CANVAS KATTINTÁS ESEMÉNYKEZELŐ
vaszon.addEventListener('click', (e) => {
    const terulet = vaszon.getBoundingClientRect();
    const kattX = e.clientX - terulet.left;
    const kattY = e.clientY - terulet.top;

    FARM_ADATOK.foldek.forEach(fold => {
        if (kattX >= fold.x && kattX <= fold.x + fold.w &&
            kattY >= fold.y && kattY <= fold.y + fold.h) {
            
            if (fold.allapot === 'ures') {
                fold.allapot = 'szantott';
            } else if (fold.allapot === 'szantott') {
                kivalasztottFoldId = fold.id;
                vetomagAblakMegnyitasa();
            } else if (fold.allapot === 'no' && !fold.megontozve) {
                fold.megontozve = true;
            } else if (fold.allapot === 'kesz') {
                // Betakarítás
                FARM_ADATOK.raktar[fold.noveny]++;
                FARM_ADATOK.xp += NOVENYEK[fold.noveny].xp;
                fold.allapot = 'ures';
                fold.noveny = null;
                feluletFrissitese();
            }
            foldekKirajzolasa();
        }
    });
});

// 4. MAIN GAME LOOP (Játékciklus - setInterval)
setInterval(() => {
    // Idő léptetése (+2 perc másodpercenként)
    FARM_ADATOK.jatekIdoPercben += 2;
    if (FARM_ADATOK.jatekIdoPercben >= 24 * 60) FARM_ADATOK.jatekIdoPercben = 0;
    nappalEjszakaCiklus();

    // Növények növekedése
    FARM_ADATOK.foldek.forEach(fold => {
        if (fold.allapot === 'no' && fold.megontozve) {
            fold.szamlalo--;
            if (fold.szamlalo <= 0) {
                fold.allapot = 'kesz';
            }
        }
    });

    // Állatok termelése
    FARM_ADATOK.allatok.forEach(allat => {
        if (allat.szamlalo > 0) allat.szamlalo--;
    });

    foldekKirajzolasa();
    allatokKirajzolasa();
}, 1000);

// Nappal / Éjszaka vizuális váltó
function nappalEjszakaCiklus() {
    const orak = Math.floor(FARM_ADATOK.jatekIdoPercben / 60);
    const percek = Math.floor(FARM_ADATOK.jatekIdoPercben % 60);
    document.getElementById('ido-kijelzo').innerText = 
        `${orak.toString().padStart(2, '0')}:${percek.toString().padStart(2, '0')}`;

    document.body.className = '';
    if (orak >= 18 && orak < 21) document.body.classList.add('naplemente');
    else if (orak >= 21 || orak < 6) document.body.classList.add('ejszaka');
}

// 5. NÉZETEK ÉS FELÜLET KEZELÉSE
function feluletFrissitese() {
    document.getElementById('arany-kijelzo').innerText = FARM_ADATOK.arany;
    document.getElementById('xp-kijelzo').innerText = FARM_ADATOK.xp;
}

function nezetValtas(nezetNev) {
    document.querySelectorAll('.nezet').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.nav-gomb').forEach(g => g.classList.remove('active'));
    
    document.getElementById(`nezet-${nezetNev}`).classList.add('active');
    event.target.classList.add('active');

    if (nezetNev === 'raktar') raktarKirajzolasa();
    if (nezetNev === 'bolt') boltKirajzolasa();
    if (nezetNev === 'allatok') allatokKirajzolasa();
}

// Vetőmag választó ablak
function vetomagAblakMegnyitasa() {
    const opciokDiv = document.getElementById('vetomag-opciok');
    opciokDiv.innerHTML = '';
    
    Object.keys(NOVENYEK).forEach(kulcs => {
        const noveny = NOVENYEK[kulcs];
        const gomb = document.createElement('button');
        gomb.className = 'akcio-gomb';
        gomb.style.margin = '5px 0';
        gomb.innerText = `${noveny.ikon} ${noveny.nev} (${noveny.ido}s)`;
        gomb.onclick = () => elultetes(kulcs);
        opciokDiv.appendChild(gomb);
    });

    document.getElementById('vetomag-ablak').style.display = 'flex';
}

function ablakBezaras() {
    document.getElementById('vetomag-ablak').style.display = 'none';
}

function elultetes(novenyKulcs) {
    const fold = FARM_ADATOK.foldek.find(f => f.id === kivalasztottFoldId);
    if (fold) {
        fold.allapot = 'no';
        fold.noveny = novenyKulcs;
        fold.szamlalo = NOVENYEK[novenyKulcs].ido;
        fold.megontozve = false;
    }
    ablakBezaras();
    foldekKirajzolasa();
}

// Raktár kezelése
function raktarKirajzolasa() {
    const lista = document.getElementById('raktar-lista');
    lista.innerHTML = '';
    
    Object.keys(FARM_ADATOK.raktar).forEach(elem => {
        const darab = FARM_ADATOK.raktar[elem];
        if(darab > 0) {
            const kartya = document.createElement('div');
            kartya.className = 'kartya';
            kartya.innerHTML = `
                <h4>${elem.toUpperCase()}</h4>
                <p>Mennyiség: ${darab} db</p>
                <button class="akcio-gomb" onclick="eladas('${elem}')">Eladás 🪙</button>
            `;
            lista.appendChild(kartya);
        }
    });
}

function eladas(elem) {
    let ar = 10;
    if(NOVENYEK[elem]) ar = NOVENYEK[elem].eladasiAr;
    if(elem === 'tojas') ar = ALLAT_BEALLITASOK.csirke.eladasiAr;
    if(elem === 'tej') ar = ALLAT_BEALLITASOK.tehen.eladasiAr;

    if (FARM_ADATOK.raktar[elem] > 0) {
        FARM_ADATOK.raktar[elem]--;
        FARM_ADATOK.arany += ar;
        feluletFrissitese();
        raktarKirajzolasa();
    }
}

// Bolt kezelése
function boltKirajzolasa() {
    const lista = document.getElementById('bolt-lista');
    lista.innerHTML = '';

    Object.keys(ALLAT_BEALLITASOK).forEach(kulcs => {
        const a = ALLAT_BEALLITASOK[kulcs];
        const kartya = document.createElement('div');
        kartya.className = 'kartya';
        kartya.innerHTML = `
            <h3>${a.ikon} ${a.nev}</h3>
            <p>Ár: ${a.ar} Arany</p>
            <button class="akcio-gomb" onclick="allatVasarlas('${kulcs}')">Vásárlás</button>
        `;
        lista.appendChild(kartya);
    });
}

function allatVasarlas(tipus) {
    const beallitas = ALLAT_BEALLITASOK[tipus];
    if (FARM_ADATOK.arany >= beallitas.ar) {
        FARM_ADATOK.arany -= beallitas.ar;
        FARM_ADATOK.allatok.push({ tipus: tipus, szamlalo: beallitas.termelesIdo });
        feluletFrissitese();
        alert(`Sikeresen vettél egy ${beallitas.nev}-t!`);
    } else {
        alert("Nincs elég aranyad!");
    }
}

// Állatok karámjának kezelése
function allatokKirajzolasa() {
    const lista = document.getElementById('allat-lista');
    lista.innerHTML = '';

    FARM_ADATOK.allatok.forEach((allat, index) => {
        const beallitas = ALLAT_BEALLITASOK[allat.tipus];
        const keszVan = allat.szamlalo === 0;
        const kartya = document.createElement('div');
        kartya.className = 'kartya';
        kartya.innerHTML = `
            <h3>${beallitas.ikon} ${beallitas.nev}</h3>
            <p>${keszVan ? 'Termék kész!' : 'Készül: ' + allat.szamlalo + 's'}</p>
            <button class="akcio-gomb" ${!keszVan ? 'disabled' : ''} onclick="termekBegyujtese(${index})">
                ${keszVan ? 'Begyűjtés: ' + beallitas.termek : 'Termelés...'}
            </button>
        `;
        lista.appendChild(kartya);
    });
}

function termekBegyujtese(index) {
    const allat = FARM_ADATOK.allatok[index];
    const beallitas = ALLAT_BEALLITASOK[allat.tipus];
    
    if (allat.tipus === 'csirke') FARM_ADATOK.raktar.tojas++;
    if (allat.tipus === 'tehen') FARM_ADATOK.raktar.tej++;

    allat.szamlalo = beallitas.termelesIdo;
    allatokKirajzolasa();
}

// Kezdő beállítások betöltése
feluletFrissitese();
foldekKirajzolasa();