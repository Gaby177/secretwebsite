const STAGES = {
    PIN_CHECK: 'PIN_CHECK',
    START: 'START',
    INTRO: 'INTRO',
    CHOICE: 'CHOICE',
    MISSION_ABORTED: 'MISSION_ABORTED',
    READY_WAIT: 'READY_WAIT',
    STAGE_1: 'STAGE_1',
    STAGE_2: 'STAGE_2',
    STAGE_3: 'STAGE_3',
    STAGE_4: 'STAGE_4',
    STAGE_5: 'STAGE_5',
    STAGE_6: 'STAGE_6',
    STAGE_7: 'STAGE_7',
    STAGE_8: 'STAGE_8',
    FINAL: 'FINAL'
};

const FREQUENCIES = {
    'Do': 261.63,
    'Re': 293.66,
    'Mi': 329.63,
    'Fa': 349.23,
    'Sol': 392.00,
    'La': 440.00,
    'Si': 493.88,
    'Do2': 523.25
};

// Game State
let currentState = localStorage.getItem('pixelGameState') || STAGES.PIN_CHECK;
let dialogueQueue = [];
let isTyping = false;
let currentTypingTimeout = null;
let musicSequenceInput = [];

// DOM Elements
const contentArea = document.getElementById('content-area');
const dialogueContainer = document.getElementById('dialogue-container');
const speakerNameEl = document.getElementById('speaker-name');
const dialogueTextEl = document.getElementById('dialogue-text');
const continueIndicator = document.getElementById('continue-indicator');
const controlsArea = document.getElementById('controls-area');
const resetBtn = document.getElementById('reset-btn');

// Audio Context
let audioCtx = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    resetBtn.addEventListener('click', fullReset);
    resetBtn.classList.add('pixel-btn', 'secondary');
});

function initGame() {
    renderStage(currentState);
}

function saveState(stage) {
    currentState = stage;
    localStorage.setItem('pixelGameState', stage);
}

function fullReset() {
    if (confirm('Sigur vrei sa stergi tot progresul?')) {
        localStorage.removeItem('pixelGameState');
        location.reload();
    }
}

// Render Logic
function renderStage(stage) {
    // Clear areas
    contentArea.innerHTML = '';
    controlsArea.innerHTML = '';
    hideDialogue();

    // Default visibility for reset button
    if (stage === STAGES.START || stage === STAGES.PIN_CHECK) {
        resetBtn.classList.add('hidden');
    } else {
        resetBtn.classList.remove('hidden');
    }

    switch (stage) {
        case STAGES.PIN_CHECK:
            contentArea.innerHTML = '<h3>ACCES RESTRICTIONAT</h3>';
            renderPinTerminal();
            break;

        case STAGES.START:
            const startBtn = createButton('Continua', () => {
                // Clear the content area (buttons) immediately
                contentArea.innerHTML = '';
                saveState(STAGES.INTRO);
                renderStage(STAGES.INTRO);
            });
            contentArea.appendChild(startBtn);
            break;

        case STAGES.INTRO:
            runIntroSequence();
            break;

        case STAGES.CHOICE:
            showChoiceScreen();
            break;

        case STAGES.MISSION_ABORTED:
            showMissionAborted();
            break;

        case STAGES.READY_WAIT:
            showReadyScreen();
            break;

        case STAGES.STAGE_1: // Google Fotos
            runStage1();
            break;

        case STAGES.STAGE_2: // Wikipedia
            runStage2();
            break;

        case STAGES.STAGE_3: // IMDB
            runStage3();
            break;

        case STAGES.STAGE_4: // Spotify
            runStage4();
            break;

        case STAGES.STAGE_5: // Bible
            runStage5();
            break;

        case STAGES.STAGE_6: // Lyrics
            runStage6();
            break;

        case STAGES.STAGE_7: // Maps
            runStage7();
            break;

        case STAGES.FINAL:
            runFinal();
            break;
    }
}

// --- Dialogue System ---

function hideDialogue() {
    dialogueContainer.classList.add('hidden');
}

function showDialogue(speaker, text, onComplete) {
    dialogueContainer.classList.remove('hidden');
    speakerNameEl.textContent = speaker;
    dialogueTextEl.textContent = '';
    continueIndicator.classList.add('hidden');
    isTyping = true;

    continueIndicator.classList.remove('blink');

    dialogueContainer.onclick = function () {
        if (isTyping) {
            clearTimeout(currentTypingTimeout);
            dialogueTextEl.textContent = text;
            isTyping = false;
            continueIndicator.classList.remove('hidden');
            continueIndicator.classList.add('blink');
        } else {
            dialogueContainer.onclick = null;
            if (onComplete) onComplete();
        }
    };

    let index = 0;
    function typeChar() {
        if (index < text.length) {
            dialogueTextEl.textContent += text.charAt(index);
            index++;
            currentTypingTimeout = setTimeout(typeChar, 30);
        } else {
            isTyping = false;
            continueIndicator.classList.remove('hidden');
            continueIndicator.classList.add('blink');
        }
    }

    typeChar();
}

function playDialogueSequence(dialogues, onAllComplete) {
    let idx = 0;

    function next() {
        if (idx < dialogues.length) {
            const d = dialogues[idx];
            idx++;
            showDialogue(d.speaker, d.text, next);
        } else {
            if (onAllComplete) onAllComplete();
        }
    }
    next();
}

// --- Helpers ---

function createButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = 'pixel-btn';
    btn.onclick = onClick;
    return btn;
}

function createInput(placeholder) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = placeholder || '';
    return inp;
}

function showFeedback(text, isError = true) {
    let fb = document.getElementById('feedback-msg');
    if (!fb) {
        fb = document.createElement('div');
        fb.id = 'feedback-msg';
        contentArea.appendChild(fb);
    }
    fb.textContent = text;
    fb.style.color = isError ? 'var(--error-color)' : 'var(--success-color)';

    if (isError) {
        const gameContainer = document.getElementById('game-container');
        gameContainer.style.transform = 'translate(5px, 5px)';
        setTimeout(() => gameContainer.style.transform = 'translate(0,0)', 100);
        setTimeout(() => gameContainer.style.transform = 'translate(-5px, -5px)', 200);
        setTimeout(() => gameContainer.style.transform = 'translate(0,0)', 300);
    }
}

function renderPinTerminal() {
    const terminal = document.createElement('div');
    terminal.className = 'pin-terminal fade-in';

    const display = document.createElement('div');
    display.className = 'pin-display';
    display.textContent = 'ENTER PIN';
    terminal.appendChild(display);

    const keypad = document.createElement('div');
    keypad.className = 'pin-keypad';

    let currentInput = '';
    const correctPin = '060301';

    const updateDisplay = () => {
        display.textContent = '*'.repeat(currentInput.length) || 'ENTER PIN';
        if (currentInput.length > 0) {
            display.style.letterSpacing = '10px';
        } else {
            display.style.letterSpacing = 'normal';
        }
    };

    const keys = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
        'CLR', '0', 'OK'
    ];

    keys.forEach(key => {
        const btn = document.createElement('div');
        btn.className = 'pin-key';
        btn.textContent = key;

        if (key === 'CLR') btn.classList.add('special');
        if (key === 'OK') btn.classList.add('confirm');

        btn.onclick = () => {
            playTone(440, 0.05); // Sound feedback

            if (key === 'CLR') {
                currentInput = '';
                display.style.color = '#00ff41'; // Reset color
                updateDisplay();
            } else if (key === 'OK') {
                if (currentInput === correctPin) {
                    display.textContent = 'ACCESS GRANTED';
                    display.style.color = '#8cba51';
                    playTone(880, 0.2);
                    setTimeout(() => {
                        saveState(STAGES.START);
                        renderStage(STAGES.START);
                    }, 1000);
                } else {
                    display.textContent = 'DENIED';
                    display.style.color = '#d95763';
                    playTone(220, 0.3);
                    /*showFeedback('ACCES RESPINS.', true);*/
                    setTimeout(() => {
                        currentInput = '';
                        display.style.color = '#00ff41';
                        updateDisplay();
                    }, 1000);
                }
            } else {
                if (currentInput.length < 6) {
                    currentInput += key;
                    display.style.color = '#00ff41'; // Reset color in case it was red/green
                    updateDisplay();
                }
            }
        };

        keypad.appendChild(btn);
    });

    terminal.appendChild(keypad);
    contentArea.appendChild(terminal);
}

// --- Audio ---
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTone(freq, duration = 0.3) {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine'; // retro sound
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// --- Stage Implementations ---

function runIntroSequence() {
    contentArea.classList.add('fade-in');

    const dialogues = [
        { speaker: 'Unknown', text: 'In ultima vreme am fost preocupat de o cercetare extrem de importanta. (apasa pentru a continua)' },
        { speaker: 'Unknown', text: 'Un specimen informatic care promitea imbunatatirea sigurantei paginilor web' },
        { speaker: 'Unknown', text: 'Inca nu stiu de ce, dar dezvoltarea lui nu a iesit cum era planuit ' },
        { speaker: 'Unknown', text: 'S-a transformat intr-un virus informatic, si a scapat din capsula in care era stocat' },
        { speaker: 'Unknown', text: 'Cu greu am reusit sa-l prind si sa-l inchid la loc.' },
        { speaker: 'Unknown', text: 'Insa a lasat in urma lui pagube care, daca nu sunt remediate...' },
        { speaker: 'Unknown', text: 'ameninta sa distruga website-uri intregi.' },
        { speaker: 'Unknown', text: 'Am nevoie de ajutorul tau pentru a le identifica si  elimina.' },
        { speaker: 'Unknown', text: 'Esti gata sa pornesti in aceasta misiune?' }
    ];
    playDialogueSequence(dialogues, () => {
        saveState(STAGES.CHOICE);
        renderStage(STAGES.CHOICE);
    });
}

function showChoiceScreen() {
    contentArea.innerHTML = '';

    const btnYes = createButton('I am ready', () => {
        // Clear buttons immediately
        controlsArea.innerHTML = '';

        const d = [
            { speaker: 'Unknown', text: 'Pentru a salva internetul, am nevoie de timpul si atentia ta.' },
            { speaker: 'Unknown', text: 'Apasa butonul urmator atunci cand esti gata.' }
        ];
        playDialogueSequence(d, () => {
            saveState(STAGES.READY_WAIT);
            renderStage(STAGES.READY_WAIT);
        });
    });

    const btnNo = createButton('I dont care', () => {
        // Clear buttons immediately
        controlsArea.innerHTML = '';
        saveState(STAGES.MISSION_ABORTED);
        renderStage(STAGES.MISSION_ABORTED);
    });

    controlsArea.innerHTML = '';
    controlsArea.appendChild(btnYes);
    controlsArea.appendChild(btnNo);
}

function showMissionAborted() {
    controlsArea.innerHTML = '';
    const d = [
        { speaker: 'Unknown', text: 'Inteleg... Uneori, cele mai importante misiuni raman neincepute.' },
        { speaker: 'Unknown', text: 'Iti doresc mult succes in drumul tau.' }
    ];
    playDialogueSequence(d, () => {
        hideDialogue();
        contentArea.innerHTML = '<h1 style="color:var(--error-color); font-size: 2.5rem; margin-bottom: 20px;">MISSION ABORTED</h1>';

        const mainScreenBtn = createButton('Main Screen', () => {
            saveState(STAGES.PIN_CHECK);
            renderStage(STAGES.PIN_CHECK);
        });
        contentArea.appendChild(mainScreenBtn);
    });
}

function showReadyScreen() {
    contentArea.innerHTML = '';

    const btn = createButton('Sunt gata', () => {
        saveState(STAGES.STAGE_1);
        renderStage(STAGES.STAGE_1);
    });
    btn.disabled = true;
    contentArea.appendChild(btn);

    const timerEl = document.createElement('div');
    timerEl.style.marginTop = '15px';
    timerEl.style.fontSize = '1.2rem';
    contentArea.appendChild(timerEl);

    let timeLeft = 10;
    timerEl.textContent = `00:${timeLeft}`;

    const interval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
        if (timeLeft <= 0) {
            clearInterval(interval);
            timerEl.textContent = '';
            btn.disabled = false;
        }
    }, 1000);
}

function runStage1() {
    hideDialogue();

    const d = [
        { speaker: 'Unknown', text: 'Super, ma bucur ca ai ales sa accepti aceasta misiune.' },
        { speaker: 'Unknown', text: 'Imi cer scuze, inca nu m-am prezentat:' },
        { speaker: 'Unknown', text: 'Numele meu este G. Cunoscut ca profesor G.' },
        { speaker: 'Profesor G', text: 'Ce trebuie sa stii despre acest virus este ca e foarte siret.' },
        { speaker: 'Profesor G', text: 'Din fericire am un dipozitiv care ma ajuta sa identific website-urile unde a produs pagube.' },
        { speaker: 'Profesor G', text: 'Sa incepem...' },
        { speaker: 'Profesor G', text: 'Aparatul imi arata ca initial virusul a trecut pe la Google Fotos.' },
        { speaker: 'Profesor G', text: 'A gasit o imagine in care a ascuns un obiect periculos.' },
        { speaker: 'Profesor G', text: 'Trebuie neaparat sa gasim acel obiect, de altfel toate pozele vor fi infectate.' },
        { speaker: 'Profesor G', text: 'Nu-i asa ca nu vrei sa pierzi toate acele amintiri frumoase?' },
        { speaker: 'Profesor G', text: 'Am reusit sa identific imaginea, dar nu si obiectul.' },
        { speaker: 'Profesor G', text: 'Este necesar sa aflam coordonatele obiectului ascuns.' },
        { speaker: 'Profesor G', text: 'Tot ce stiu este ca a lasat urmatoarea ghicitoare:' },
        { speaker: 'Profesor G', text: 'Acest obiect nu functioneaza singur, dar fara el nimic nu se deschide. In ce casuta se afla?' }
    ];

    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';
        const img = document.createElement('img');
        img.src = 'img/find.webp';
        img.className = 'game-img fade-in';
        contentArea.appendChild(img);

        const inp = createInput('ex:A1');
        contentArea.appendChild(inp);

        const btn = createButton('Verifica', () => {
            if (inp.value.toUpperCase().trim() === 'F2') {
                saveState(STAGES.STAGE_2);
                renderStage(STAGES.STAGE_2);
            } else {
                showFeedback('Obiectul nu este acolo... mai incearca.', true)
            }
        });
        contentArea.appendChild(btn);
    });
}

function runStage2() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: 'Excelent, ai reusit sa identifici obiectul, care era defapt o cheie.' },
        { speaker: 'Profesor G', text: 'Acum pot sa o elimin si sa salvez toate pozele.' },
        { speaker: 'Profesor G', text: 'M-ai ajutat sa salvez acele amintiri frumoase pe care le stocam in poze.' },
        { speaker: 'Profesor G', text: 'Se pare ca urmatorul obiectiv a fost Wikipedia.com' },
        { speaker: 'Profesor G', text: 'Acolo a ascuns o diversiune.' },
        { speaker: 'Profesor G', text: 'Daca nu o identificam, va altera toate definitiile.' },
        { speaker: 'Profesor G', text: 'A ascuns-o chiar in definitia lui. ' },
        { speaker: 'Profesor G', text: 'Poti sa identifici definitia corecta?' }
    ];
    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';

        const defs = [
            { text: 'Un virus este un microorganism microscopic care face parte din categoria organismelor unicelulare si care se reproduce prin diviziune celulara...', correct: false },
            { text: 'Un virus este un agent infectios microscopic, alcătuit din material genetic (ADN sau ARN) invelit într-o capsida proteica, care se poate multiplica doar in interiorul celulelor vii ale unui organism gazda.', correct: true },
            { text: 'Un virus este o bacterie extrem de mica, invizibila cu microscopul optic obisnuit...', correct: false }
        ];

        const container = document.createElement('div');
        container.className = 'def-card-container fade-in';

        defs.forEach(def => {
            const card = document.createElement('div');
            card.className = 'def-card';
            card.textContent = def.text;

            card.onclick = () => {
                if (def.correct) {
                    saveState(STAGES.STAGE_3);
                    renderStage(STAGES.STAGE_3);
                } else {
                    showFeedback('Nu cred ca este aceasta... mai incearca.', true);
                }
            };
            container.appendChild(card);
        });

        contentArea.appendChild(container);
    });
}

function runStage3() {
    hideDialogue();
    // Split dialogue to insert game
    const d1 = [
        { speaker: 'Profesor G', text: 'Minunat, ai reusit sa identifici definitia corecta.' },
        { speaker: 'Profesor G', text: 'Acum am eliminat complet diversiunea.' },
        { speaker: 'Profesor G', text: 'Este foarte important ca definitiile sa ramana corecte.' },
        { speaker: 'Profesor G', text: 'Sa mergem mai departe..' },
        { speaker: 'Profesor G', text: 'Aparatul imi indica acum ca virusul a trecut apoi pe la Imdb.com.' },
        { speaker: 'Profesor G', text: 'A vizitat animatia Klaus.' },
        { speaker: 'Profesor G', text: 'O fi virus dar trebuie sa recunosc, are gusturi bune :D' },
        { speaker: 'Profesor G', text: 'Klaus e o animatie excelenta, ti-o recomand cu drag daca nu ai vazut-o inca.' },
        { speaker: 'Profesor G', text: 'Se pare ca aici a sters anul de lansare al unor filme' },
        { speaker: 'Profesor G', text: 'Daca nu le punem la loc, aceste filme risca sa dispara.' },
        { speaker: 'Profesor G', text: 'Vezi daca poti sa identifici anii de lansare pentru filmele urmatoare:' }
    ];

    playDialogueSequence(d1, () => {
        contentArea.innerHTML = '';

        const movies = [
            { id: 'lionking', img: 'img/movie1.webp', year: 1994 },
            { id: 'homealone', img: 'img/movie2.webp', year: 1992 },
            { id: 'joseph', img: 'img/movie3.webp', year: 2000 }
        ];

        const grid = document.createElement('div');
        grid.className = 'movie-grid fade-in';

        // State to track correct answers
        const status = { lionking: false, homealone: false, joseph: false };

        movies.forEach(m => {
            const card = document.createElement('div');
            card.className = 'movie-card';

            const img = document.createElement('img');
            img.src = m.img;
            img.className = 'movie-thumb';

            const inp = createInput('Anul?');
            inp.type = 'number';
            inp.oninput = (e) => {
                if (parseInt(e.target.value) === m.year) {
                    status[m.id] = true;
                    e.target.style.borderColor = 'var(--success-color)';
                    e.target.disabled = true;
                    checkAllMovies();
                }
            };

            card.appendChild(img);
            card.appendChild(inp);
            grid.appendChild(card);
        });

        contentArea.appendChild(grid);

        function checkAllMovies() {
            if (status.lionking && status.homealone && status.joseph) {
                setTimeout(() => {
                    saveState(STAGES.STAGE_4);
                    renderStage(STAGES.STAGE_4);
                }, 1000);
            }
        }
    });
}

function runStage4() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: 'Foarte bine, ai identificat corect datelele de lansare.' },
        { speaker: 'Profesor G', text: 'Ar fi fost pacat ca aceste filme sa fi disparut.' },
        { speaker: 'Profesor G', text: 'Sa continuam cu urmatorul obiectiv al virusului: Spotify.com' },
        { speaker: 'Profesor G', text: 'Aici a lasat o bariera - un mic puzzle pe care trebuie sa-l rezolvi.' },
        { speaker: 'Profesor G', text: 'Pentru a continua sa ii luam urma, am nevoie de urechea ta muzicala.' },
        { speaker: 'Profesor G', text: 'Poti identifica pattern-ul melodiei? (P.S O sa ai nevoie de sunet)' }
    ];
    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';

        const audio = document.getElementById('twinkle-track');
        let isPlaying = false;

        const playBtn = createButton('Play Music', () => {
            if (!isPlaying) {
                audio.currentTime = 0;
                audio.play();
                playBtn.textContent = 'Pause Music';
                isPlaying = true;
            } else {
                audio.pause();
                playBtn.textContent = 'Play Music';
                isPlaying = false;
            }
        });

        contentArea.appendChild(playBtn);

        const grid = document.createElement('div');
        grid.className = 'music-grid';

        const notes = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do2'];
        musicSequenceInput = [];

        notes.forEach(note => {
            const btn = document.createElement('button');
            btn.textContent = note;
            btn.className = 'note-btn';
            btn.onclick = () => {
                if (isPlaying) {
                    audio.pause();
                    playBtn.textContent = 'Play Music';
                    isPlaying = false;
                }

                playTone(FREQUENCIES[note]);
                checkMusicInput(note);
            };
            grid.appendChild(btn);
        });
        contentArea.appendChild(grid);
    });
}

function checkMusicInput(note) {
    const target = [
        'Do', 'Do', 'Sol', 'Sol', 'La', 'La', 'Sol',
        'Fa', 'Fa', 'Mi', 'Mi', 'Re', 'Re', 'Do'
    ];

    musicSequenceInput.push(note);

    const currentIndex = musicSequenceInput.length - 1;
    if (musicSequenceInput[currentIndex] !== target[currentIndex]) {
        musicSequenceInput = [];
        showFeedback('Gresit! Secventa s-a resetat.', true);
    } else {
        if (musicSequenceInput.length === target.length) {
            saveState(STAGES.STAGE_5);
            renderStage(STAGES.STAGE_5);
        }
    }
}

function runStage5() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: 'Bravo! Eram sigur ca nu o sa ai probleme cu acest puzzle.' },
        { speaker: 'Profesor G', text: 'Stiam ca ai ureche muzicala si cu siguranta ca ti s-a mai spus ca ai o voce frumoasa' },
        { speaker: 'Profesor G', text: 'Continua sa dezvolti aceasta calitate pe care o ai. ' },
        { speaker: 'Profesor G', text: 'Bun, sa continuam cu misiunea noastra.' },
        { speaker: 'Profesor G', text: 'Din datele mele, virusul a trecut si pe la MyBible.eu.' },
        { speaker: 'Profesor G', text: 'Vad ca a sters referinta unui verset, si trebuie sa o punem la loc' },
        { speaker: 'Profesor G', text: 'Reusesti sa gasesti referinta versetului?' }
    ];

    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';

        const quote = document.createElement('blockquote');
        quote.textContent = '„Eu am cautat pe Domnul, si mi-a raspuns: m-a izbavit din toate temerile mele.”';
        contentArea.appendChild(quote);

        const container = document.createElement('div');
        container.className = 'dropdown-container';

        const selBook = document.createElement('select');
        [
            'Geneza', 'Exodul', 'Leviticul', 'Numeri', 'Deuteronomul',
            'Iosua', 'Judecatori', 'Rut',
            '1 Samuel', '2 Samuel', '1 Imparati', '2 Imparati',
            '1 Cronici', '2 Cronici', 'Ezra', 'Neemia', 'Estera',
            'Iov', 'Psalmii', 'Proverbe', 'Eclesiastul', 'Cantarea Cantarilor',
            'Isaia', 'Ieremia', 'Plangerile lui Ieremia', 'Ezechiel', 'Daniel',
            'Osea', 'Ioel', 'Amos', 'Obadia', 'Iona', 'Mica',
            'Naum', 'Habacuc', 'Tefania', 'Hagai', 'Zaharia', 'Maleahi',
            'Matei', 'Marcu', 'Luca', 'Ioan',
            'Fapte',
            'Romani', '1 Corinteni', '2 Corinteni',
            'Galateni', 'Efeseni', 'Filipeni', 'Coloseni',
            '1 Tesaloniceni', '2 Tesaloniceni',
            '1 Timotei', '2 Timotei', 'Tit', 'Filimon',
            'Evrei', 'Iacov',
            '1 Petru', '2 Petru',
            '1 Ioan', '2 Ioan', '3 Ioan',
            'Iuda',
            'Apocalipsa'
        ].forEach(b => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = b;
            selBook.appendChild(opt);
        });

        const selChap = document.createElement('select');
        for (let i = 1; i <= 150; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            selChap.appendChild(opt);
        }

        const selVerse = document.createElement('select');
        for (let i = 1; i <= 50; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            selVerse.appendChild(opt);
        }

        container.appendChild(selBook);
        container.appendChild(selChap);
        container.appendChild(selVerse);
        contentArea.appendChild(container);

        const btn = createButton('Verifica', () => {
            if (selBook.value === 'Psalmii' && selChap.value == '34' && selVerse.value == '4') {
                saveState(STAGES.STAGE_6);
                renderStage(STAGES.STAGE_6);
            } else {
                showFeedback('Dispozitivul imi indica ca e gresit. Mai cauta.', true);
            }
        });
        btn.style.marginTop = '20px';
        contentArea.appendChild(btn);
    });
}

function runStage6() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: 'L-ai gasit!' },
        { speaker: 'Profesor G', text: 'Ma bucur, deoarece chiar este un verset frumos' },
        { speaker: 'Profesor G', text: 'Sper sa il pastrezi in inima ta anul acesta.' },
        { speaker: 'Profesor G', text: 'Domnul sa te pazeasca si sa te umple cu toate binecuvantarile Sale.' },
        { speaker: 'Profesor G', text: 'Bun...' },
        { speaker: 'Profesor G', text: 'Sa continuam cu virusul nostru.' },
        { speaker: 'Profesor G', text: 'Urmatorul website pe pe care l-a corupt este Youtube.com' },
        { speaker: 'Profesor G', text: 'Observ ca a trecut pe la un videoclip muzical si a sters niste cuvinte din versuri.' },
        { speaker: 'Profesor G', text: 'Sunt convins ca esti persoana potrivita' },
        { speaker: 'Profesor G', text: 'Stiu ca vei gasi cu usurinta cuvintele lipsa' },
        { speaker: 'Profesor G', text: 'Iata versurile:' }
    ];

    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.style.fontSize = '1.1rem';
        wrapper.style.lineHeight = '2';

        wrapper.innerHTML = `
            La pieptul Tau mereu, 
            <input type="text" id="lyric1" style="width: 120px; display:inline-block; padding: 5px; margin: 0 5px;"> 
            eu gasesc.<br>
            Doar la Tine 
            <input type="text" id="lyric2" style="width: 120px; display:inline-block; padding: 5px; margin: 0 5px;"> 
            pot afla.
        `;
        contentArea.appendChild(wrapper);

        const btn = createButton('Verifica', () => {
            const val1 = document.getElementById('lyric1').value.trim().toLowerCase();
            const val2 = document.getElementById('lyric2').value.trim().toLowerCase();

            const valid1 = (val1 === 'odihna' || val1 === 'odihnă');
            const valid2 = (val2 === 'pace');

            if (valid1 && valid2) {
                saveState(STAGES.STAGE_7);
                renderStage(STAGES.STAGE_7);
            } else {
                showFeedback('Ceva nu e bine...', true);
            }
        });
        btn.style.marginTop = '20px';
        contentArea.appendChild(btn);
    });
}

function runStage7() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: 'Perfect, nici nu imi faceam griji ca nu vei reusi :)' },
        { speaker: 'Profesor G', text: 'Foarte frumoasa melodia, cat si interpretarea ;)' },
        { speaker: 'Profesor G', text: 'Acum ca am reparat dauna, mergem mai departe.' },
        { speaker: 'Profesor G', text: 'Aparatul meu indica ultimul website corupt: Google Maps' },
        { speaker: 'Profesor G', text: 'Am reusit sa gasesc locatia unde a creat o bresa.' },
        { speaker: 'Profesor G', text: 'Ca sa inchid bresa trebuie sa stiu numele strazii unde a fost creata' },
        { speaker: 'Profesor G', text: 'Am un presentiment ca vei stii numele acestei strazi:' }
    ];

    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';
        const img = document.createElement('img');
        img.src = 'img/map.webp';
        img.className = 'game-img';
        contentArea.appendChild(img);

        const inp = createInput('Ce strada este?');
        contentArea.appendChild(inp);

        const btn = createButton('Verifica', () => {
            const v = inp.value.trim().toLowerCase();
            const valid = ['calle de rusia', 'calle rusia', 'c. rusia', 'c. de rusia', 'c rusia', 'c de rusia'].includes(v);

            if (valid) {
                saveState(STAGES.FINAL);
                renderStage(STAGES.FINAL);
            } else {
                showFeedback('Nup...nu este asta', true);
            }
        });
        contentArea.appendChild(btn);
    });
}

function runFinal() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: 'Perfect, asta era numele strazii!' },
        { speaker: 'Profesor G', text: 'Acum imi aduc si eu aminte:' },
        { speaker: 'Profesor G', text: 'Am petrecut cativa ani in acest loc, ce amintiri fumoase...' },
        { speaker: 'Profesor G', text: 'In sfarsit reparat toate daunele lasate in urma.' },
        { speaker: 'Profesor G', text: 'Iti multumesc pentru tot ajutorul oferit.' },
        { speaker: 'Profesor G', text: 'Acum pot sta linistit stiind ca internetul este salvat.' },
        { speaker: 'Profesor G', text: 'Mult succes in viitor, si fereste-te de orice fel de virusi :))' }
    ];
    playDialogueSequence(d, () => {
        hideDialogue();
        contentArea.innerHTML = '<h1 style="color: var(--success-color); font-size: 3rem;">FIN</h1>';

        const bigReset = createButton('Reset Story', fullReset);
        bigReset.style.marginTop = '40px';
        contentArea.appendChild(bigReset);

        resetBtn.classList.add('hidden');
    });
}

