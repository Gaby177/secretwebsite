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
            contentArea.innerHTML = '<h3>ACCES RESTRICTIONAT</h3><p>Identificare necesara.</p>';

            const pinGroup = document.createElement('div');
            pinGroup.style.display = 'flex';
            pinGroup.style.flexDirection = 'column';
            pinGroup.style.alignItems = 'center';
            pinGroup.style.gap = '15px';

            const pinInp = createInput('Introdu codul PIN');
            pinInp.type = 'password';
            pinInp.style.textAlign = 'center';
            pinInp.style.letterSpacing = '5px';
            pinInp.maxLength = 6;

            const submitPin = createButton('Acceseaza', () => {
                if (pinInp.value === '060301') {
                    saveState(STAGES.START);
                    renderStage(STAGES.START);
                } else {
                    showFeedback('ACCES RESPINS. Cod incorect.', true);
                    pinInp.value = '';
                }
            });

            pinGroup.appendChild(pinInp);
            pinGroup.appendChild(submitPin);
            contentArea.appendChild(pinGroup);
            break;

        case STAGES.START:
            const startBtn = createButton('Apasa-ma', () => {
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

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
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
        { speaker: 'Unknown', text: 'Felicitari... Daca ai apasat acest buton, inseamna ca TU esti persoana aleasa.' },
        { speaker: 'Unknown', text: 'Numele meu este G. In ultima vreme am fost complet absorbit de o cercetare extrem de importanta.' },
        { speaker: 'Profesor G', text: 'Un virus misterios creste de la o zi la alta, infiltrandu-se in tot spatiul virtual.' },
        { speaker: 'Profesor G', text: 'Daca nu este oprit, internetul asa cum il stim ar putea disparea.' },
        { speaker: 'Profesor G', text: 'Pentru a-l opri... am nevoie de ajutorul tau.' },
        { speaker: 'Profesor G', text: 'Daca te intrebi "De ce eu?", raspunsul va veni pe parcurs.' },
        { speaker: 'Profesor G', text: 'Esti pregatita sa pornesti in aceasta aventura?' }
    ];
    playDialogueSequence(dialogues, () => {
        saveState(STAGES.CHOICE);
        renderStage(STAGES.CHOICE);
    });
}

function showChoiceScreen() {
    contentArea.innerHTML = '';

    const btnYes = createButton('Da, sunt pregatita!', () => {
        const d = [
            { speaker: 'Profesor G', text: 'Pentru a salva internetul, am nevoie de timpul si atentia ta.' },
            { speaker: 'Profesor G', text: 'Apasa butonul de mai jos doar atunci cand simti ca esti cu adevarat pregatita.' }
        ];
        playDialogueSequence(d, () => {
            saveState(STAGES.READY_WAIT);
            renderStage(STAGES.READY_WAIT);
        });
    });

    const btnNo = createButton('Nu ma intereseaza', () => {
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
        { speaker: 'Profesor G', text: 'Inteleg... Uneori, cele mai importante misiuni raman neincepute.' },
        { speaker: 'Profesor G', text: 'Iti doresc mult succes in drumul tau.' }
    ];
    playDialogueSequence(d, () => {
        hideDialogue();
        contentArea.innerHTML = '<h1 style="color:var(--error-color); font-size: 2.5rem;">MISSION ABORTED</h1>';
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

    let timeLeft = 15;
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
        { speaker: 'Profesor G', text: 'Prima urma apare in Google Fotos.' },
        { speaker: 'Profesor G', text: 'Virusul s-a ascuns sub forma unei chei.' },
        { speaker: 'Profesor G', text: 'Vezi daca poti sa identifici in ce casuta se afla cheia.' }
    ];

    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';
        const img = document.createElement('img');
        img.src = 'find.png';
        img.className = 'game-img fade-in';
        contentArea.appendChild(img);

        const inp = createInput('In ce casuta se afla cheia?');
        contentArea.appendChild(inp);

        const btn = createButton('Verifica', () => {
            if (inp.value.toUpperCase().trim() === 'D4') {
                saveState(STAGES.STAGE_2);
                renderStage(STAGES.STAGE_2);
            } else {
                showFeedback('Cheia nu este acolo... mai incearca.', true);
            }
        });
        contentArea.appendChild(btn);
    });
}

function runStage2() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: 'Următoarea oprire: wikipedia.com.Virusul s-a ascuns chiar în definiția lui.' },
        { speaker: 'Profesor G', text: 'Alege varianta corecta.' }
    ];
    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';

        const defs = [
            { text: 'Un virus este un microorganism microscopic care face parte din categoria organismelor unicelulare și care se reproduce prin diviziune celulară...', correct: false },
            { text: 'Un virus este un agent infecțios microscopic, alcătuit din material genetic (ADN sau ARN) învelit într-o capsidă proteică, care se poate multiplica doar în interiorul celulelor vii ale unui organism gazdă.', correct: true },
            { text: 'Un virus este o bacterie extrem de mică, invizibilă cu microscopul optic obișnuit...', correct: false }
        ];

        defs.forEach(def => {
            const btn = createButton(def.text, () => {
                if (def.correct) {
                    saveState(STAGES.STAGE_3);
                    renderStage(STAGES.STAGE_3);
                } else {
                    showFeedback('Incorect... mai incearca.', true);
                }
            });
            btn.style.width = '100%';
            btn.style.marginBottom = '10px';
            contentArea.appendChild(btn);
        });
    });
}

function runStage3() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: 'Se pare că virusul a trecut apoi pe imdb.com.' },
        { speaker: 'Profesor G', text: 'A vizitat animatia Klaus.O fi virus… dar trebuie să recunosc, are gusturi excelente 😄' },
        { speaker: 'Profesor G', text: 'Klaus e o animație excelentă, ți-o recomand cu drag dacă n-ai apucat s-o vezi.' }
    ];
    playDialogueSequence(d, () => {
        saveState(STAGES.STAGE_4);
        renderStage(STAGES.STAGE_4);
    });
}

function runStage4() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: 'Următoarea urmă: spotify.com.' },
        { speaker: 'Profesor G', text: 'Ce noroc că am ales pe cineva cu ureche muzicală.' },
        { speaker: 'Profesor G', text: 'Pentru a continua, trebuie să reproduci pattern-ul melodiei.' }
    ];
    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';

        const audio = document.getElementById('twinkle-track');
        let isPlaying = false;

        const playBtn = createButton('▶ Play Music', () => {
            if (!isPlaying) {
                audio.currentTime = 0;
                audio.play();
                playBtn.textContent = '⏸ Pause Music';
                isPlaying = true;
            } else {
                audio.pause();
                playBtn.textContent = '▶ Play Music';
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
                    playBtn.textContent = '▶ Play Music';
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
        { speaker: 'Profesor G', text: 'Din datele mele, virusul a trecut și pe la mybible.eu.' },
        { speaker: 'Profesor G', text: 'S-a ascuns într-un verset plin de speranță.' }
    ];

    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';

        const quote = document.createElement('blockquote');
        quote.textContent = '„Eu am cautat pe Domnul, si mi-a raspuns: m-a izbavit din toate temerile mele.”';
        contentArea.appendChild(quote);

        const container = document.createElement('div');
        container.className = 'dropdown-container';

        const selBook = document.createElement('select');
        ['Geneza', 'Exodul', 'Psalmii', 'Proverbe', 'Isaia'].forEach(b => {
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
                showFeedback('Nu este corect. Mai cauta.', true);
            }
        });
        btn.style.marginTop = '20px';
        contentArea.appendChild(btn);
    });
}

function runStage6() {
    hideDialogue();
    const d = [{ speaker: 'Profesor G', text: 'Completeaza versurile lipsa.' }];

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

            const valid1 = (val1 === 'odihna');
            const valid2 = (val2 === 'pace');

            if (valid1 && valid2) {
                saveState(STAGES.STAGE_7);
                renderStage(STAGES.STAGE_7);
            } else {
                showFeedback('Versurile nu sunt corecte.', true);
            }
        });
        btn.style.marginTop = '20px';
        contentArea.appendChild(btn);
    });
}

function runStage7() {
    hideDialogue();
    const d = [{ speaker: 'Profesor G', text: 'Unde a fost facuta poza?' }];

    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';
        const img = document.createElement('img');
        img.src = 'map.png';
        img.className = 'game-img';
        contentArea.appendChild(img);

        const inp = createInput('Ce strada este?');
        contentArea.appendChild(inp);

        const btn = createButton('Verifica', () => {
            const v = inp.value.trim().toLowerCase();
            const valid = ['calle de rusia', 'calle rusia', 'c. rusia'].includes(v);

            if (valid) {
                saveState(STAGES.FINAL);
                renderStage(STAGES.FINAL);
            } else {
                showFeedback('Locatie incorecta.', true);
            }
        });
        contentArea.appendChild(btn);
    });
}

function runFinal() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: 'Ai reusit sa salvezi internetul.' },
        { speaker: 'Profesor G', text: 'Iti multumesc.' }
    ];
    playDialogueSequence(d, () => {
        hideDialogue();
        contentArea.innerHTML = '<h1 style="color: var(--success-color); font-size: 3rem;">FIN</h1>';

        const bigReset = createButton('Reset Game', fullReset);
        bigReset.style.marginTop = '40px';
        contentArea.appendChild(bigReset);

        resetBtn.classList.add('hidden');
    });
}
