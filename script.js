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
    if (confirm('¿Estás seguro de que quieres borrar todo el progreso?')) {
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
            contentArea.innerHTML = '<h3>ACCESO RESTRINGIDO</h3>';
            renderPinTerminal();
            break;

        case STAGES.START:
            const startBtn = createButton('Continuar', () => {
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

let feedbackTimeout;
function showFeedback(text, isError = true, duration = null) {
    let fb = document.getElementById('feedback-msg');
    if (!fb) {
        fb = document.createElement('div');
        fb.id = 'feedback-msg';
        contentArea.appendChild(fb);
    }
    fb.textContent = text;
    fb.style.color = isError ? 'var(--error-color)' : 'var(--success-color)';

    if (feedbackTimeout) {
        clearTimeout(feedbackTimeout);
    }

    if (duration) {
        feedbackTimeout = setTimeout(() => {
            fb.textContent = '';
        }, duration);
    }

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
    display.textContent = 'INTRODUCIR PIN';
    terminal.appendChild(display);

    const keypad = document.createElement('div');
    keypad.className = 'pin-keypad';

    let currentInput = '';
    const correctPin = '060301';

    const updateDisplay = () => {
        display.textContent = '*'.repeat(currentInput.length) || 'INTRODUCIR PIN';
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
                    display.textContent = 'ACCESO CONCEDIDO';
                    display.style.color = '#8cba51';
                    playTone(880, 0.2);
                    setTimeout(() => {
                        saveState(STAGES.START);
                        renderStage(STAGES.START);
                    }, 1000);
                } else {
                    display.textContent = 'DENEGADO';
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

function playTone(freq, duration = 0.5) {
    initAudio();
    const now = audioCtx.currentTime;

    // We use multiple oscillators to mimic a piano's rich harmonic content
    // Fundamental, second harmonic (octave), and third harmonic (perfect fifth)
    const harmonics = [
        { type: 'sine', ratio: 1, gain: 0.5 },
        { type: 'triangle', ratio: 2, gain: 0.2 },
        { type: 'sine', ratio: 3, gain: 0.1 }
    ];

    harmonics.forEach(h => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = h.type;
        osc.frequency.setValueAtTime(freq * h.ratio, now);

        // Piano envelope: sharp attack, exponential decay
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(h.gain, now + 0.01); // Instant strike
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + duration);
    });
}

// --- Stage Implementations ---

function runIntroSequence() {
    contentArea.classList.add('fade-in');

    const dialogues = [
        { speaker: 'Desconocido', text: 'Últimamente me he dedicado a una investigación extremadamente importante. (pulsa para continuar)' },
        { speaker: 'Desconocido', text: 'Un espécimen informático que prometía mejorar la seguridad de las páginas web.' },
        { speaker: 'Desconocido', text: 'Aún no sé por qué, pero su desarrollo no salió como estaba planeado.' },
        { speaker: 'Desconocido', text: 'Se transformó en un virus informaticó y escapó de la cápsula donde estaba almacenado.' },
        { speaker: 'Desconocido', text: 'Con mucho esfuerzo logré atraparlo y encerrarlo de nuevo.' },
        { speaker: 'Desconocido', text: 'Pero dejó tras de sí daños que, si no se reparan...' },
        { speaker: 'Desconocido', text: 'amenazan con destruir sitios web enteros.' },
        { speaker: 'Desconocido', text: 'Necesito tu ayuda para identificarlos y eliminarlos.' },
        { speaker: 'Desconocido', text: '¿Estás lista para emprender esta misión?' }
    ];
    playDialogueSequence(dialogues, () => {
        saveState(STAGES.CHOICE);
        renderStage(STAGES.CHOICE);
    });
}

function showChoiceScreen() {
    contentArea.innerHTML = '';

    const btnYes = createButton('¡Estoy lista!', () => {
        // Clear buttons immediately
        controlsArea.innerHTML = '';

        const d = [
            { speaker: 'Desconocido', text: 'Para salvar el internet, necesito tu tiempo y atención.' },
            { speaker: 'Desconocido', text: 'Pulsa el siguiente botón cuando estés preparada.' }
        ];
        playDialogueSequence(d, () => {
            saveState(STAGES.READY_WAIT);
            renderStage(STAGES.READY_WAIT);
        });
    });

    const btnNo = createButton('¡No me importa!', () => {
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
        { speaker: 'Desconocido', text: 'Entiendo... a veces, las misiones más importantes se quedan sin empezar.' },
        { speaker: 'Desconocido', text: 'Te deseo mucho éxito en tu camino.' }
    ];
    playDialogueSequence(d, () => {
        hideDialogue();
        contentArea.innerHTML = '<h1 style="color:var(--error-color); font-size: 2.5rem; margin-bottom: 20px;">MISIÓN ABORTADA</h1>';

        const mainScreenBtn = createButton('Pantalla Principal', () => {
            saveState(STAGES.PIN_CHECK);
            renderStage(STAGES.PIN_CHECK);
        });
        contentArea.appendChild(mainScreenBtn);
    });
}

function showReadyScreen() {
    contentArea.innerHTML = '';

    const btn = createButton('Estoy Preparada', () => {
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
        { speaker: 'Desconocido', text: 'Genial, me alegra que hayas aceptado esta misión.' },
        { speaker: 'Desconocido', text: 'Aún no me he presentado:' },
        { speaker: 'Desconocido', text: 'Mi nombre es G. Conocido como el Profesor G.' },
        { speaker: 'Profesor G', text: 'Lo que debes saber sobre este virus es que es muy astuto.' },
        { speaker: 'Profesor G', text: 'Por suerte, tengo un dispositivo que me ayuda a identificar los sitios web donde ha causado daños.' },
        { speaker: 'Profesor G', text: 'Empecemos...' },
        { speaker: 'Profesor G', text: 'El aparato me indica que inicialmente el virus pasó por Google Fotos.' },
        { speaker: 'Profesor G', text: 'Encontró una imagen en la que escondió un objeto peligroso.' },
        { speaker: 'Profesor G', text: 'Debemos encontrar ese objeto sin falta, de lo contrario, todas las fotos se infectarán.' },
        { speaker: 'Profesor G', text: 'No querrás perder todos esos hermosos recuerdos, ¿verdad?' },
        { speaker: 'Profesor G', text: 'He logrado identificar la imagen, pero no el objeto.' },
        { speaker: 'Profesor G', text: 'Es necesario descubrir las coordenadas del objeto oculto.' },
        { speaker: 'Profesor G', text: 'Todo lo que sé es que dejó el siguiente acertijo:' },
        { speaker: 'Profesor G', text: 'Este objeto no funciona solo, pero sin él nada se abre. ¿En qué casilla se encuentra? (pulsa para mostrar la imagen)' }
    ];

    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';
        const img = document.createElement('img');
        img.src = 'img/find.webp';
        img.className = 'game-img fade-in';
        contentArea.appendChild(img);

        const inp = createInput('ej: A1');
        contentArea.appendChild(inp);

        const btn = createButton('Verificar', () => {
            if (inp.value.toUpperCase().trim() === 'F2') {
                saveState(STAGES.STAGE_2);
                renderStage(STAGES.STAGE_2);
            } else {
                showFeedback('El objeto no está ahí... inténtalo de nuevo.', true)
            }
        });
        contentArea.appendChild(btn);
    });
}

function runStage2() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: '¡Excelente! Lograste identificar el objeto, que en realidad era una llave.' },
        { speaker: 'Profesor G', text: 'Ahora puedo eliminarla y salvar todas las fotos.' },
        { speaker: 'Profesor G', text: 'Me has ayudado a salvar esos hermosos recuerdos que guardábamos en las imágenes.' },
        { speaker: 'Profesor G', text: 'Parece que el siguiente objetivo fue Wikipedia.com.' },
        { speaker: 'Profesor G', text: 'Allí escondió una distracción.' },
        { speaker: 'Profesor G', text: 'Si no la identificamos, alterará todas las definiciones.' },
        { speaker: 'Profesor G', text: 'La escondió justo en su propia definición.' },
        { speaker: 'Profesor G', text: '¿Puedes identificar la definición correcta de virus?' }
    ];
    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';

        const defs = [
            { text: 'Un virus es un microorganismo microscópico que forma parte de la categoría de organismos unicelulares y que se reproduce por división celular...', correct: false },
            { text: 'Un virus es un agente infeccioso microscópico, compuesto por material genético (ADN o ARN) envuelto en una cápside proteica, que solo puede multiplicarse dentro de las células vivas de un organismo huésped.', correct: true },
            { text: 'Un virus es una bacteria extremadamente pequeña, invisible con un microscopio óptico común...', correct: false }
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
                    showFeedback('No creo que sea esta... inténtalo de nuevo.', true);
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
        { speaker: 'Profesor G', text: 'Correcto, lograste identificar la definición.' },
        { speaker: 'Profesor G', text: 'Ahora he eliminado completamente la distracción.' },
        { speaker: 'Profesor G', text: 'Mi aparato me indica que el virus pasó después por Imdb.com.' },
        { speaker: 'Profesor G', text: 'Parece que ha borrado el año de estreno de algunas películas.' },
        { speaker: 'Profesor G', text: 'Si no los recuperamos, estas películas corren el riesgo de desaparecer.' },
        { speaker: 'Profesor G', text: 'Mira si puedes identificar los años de estreno de las siguientes películas:' }
    ];

    playDialogueSequence(d1, () => {
        contentArea.innerHTML = '';

        const movies = [
            { id: 'lionking', img: 'img/movie1.webp', year: 1994 },
            { id: 'homealone', img: 'img/movie2.webp', year: 1992 },
            { id: 'klaus', img: 'img/movie3.webp', year: 2019 }
        ];

        const grid = document.createElement('div');
        grid.className = 'movie-grid fade-in';

        // State to track correct answers
        const status = { lionking: false, homealone: false, klaus: false };

        movies.forEach(m => {
            const card = document.createElement('div');
            card.className = 'movie-card';

            const img = document.createElement('img');
            img.src = m.img;
            img.className = 'movie-thumb';

            const inp = createInput('¿Año?');
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
            if (status.lionking && status.homealone && status.klaus) {
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
        { speaker: 'Profesor G', text: 'Muy bien, has identificado correctamente las fechas de estreno.' },
        { speaker: 'Profesor G', text: 'Habría sido una pena que estas películas desaparecieran.' },
        { speaker: 'Profesor G', text: 'Y debo admitir que el virus tiene buen gusto :D' },
        { speaker: 'Profesor G', text: 'La última, Klaus, es una animación excelente que te recomiendo de todo corazón si aún no la has visto.' },
        { speaker: 'Profesor G', text: 'Continuemos con el siguiente objetivo del virus: Spotify.com.' },
        { speaker: 'Profesor G', text: 'Aquí ha dejado una barrera: un pequeño puzzle que debes resolver.' },
        { speaker: 'Profesor G', text: 'Para seguirle el rastro, necesito tu oído musical.' },
        { speaker: 'Profesor G', text: '¿Puedes identificar las notas de la melodía? (P.D. Necesitarás sonido)' }
    ];
    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';

        const audio = document.getElementById('twinkle-track');
        let isPlaying = false;

        const playBtn = createButton('Reproducir Música', () => {
            if (!isPlaying) {
                audio.currentTime = 0;
                audio.play();
                playBtn.textContent = 'Pausar Música';
                isPlaying = true;
            } else {
                audio.pause();
                playBtn.textContent = 'Reproducir Música';
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
                    playBtn.textContent = 'Reproducir Música';
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
        showFeedback('¡Incorrecto! La secuencia se ha reiniciado.', true, 1000);
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
        { speaker: 'Profesor G', text: 'Estaba seguro de que no tendrías problemas con este puzzle.' },
        { speaker: 'Profesor G', text: 'Sabía que tenías oído musical, y seguro que también te han dicho que tienes una voz hermosa.' },
        { speaker: 'Profesor G', text: 'Sigue desarrollando esa cualidad que tienes.' },
        { speaker: 'Profesor G', text: 'Bien, continuemos con nuestra misión.' },
        { speaker: 'Profesor G', text: 'Según mis datos, el virus también pasó por MyBible.eu.' },
        { speaker: 'Profesor G', text: 'Borró la referencia de un versículo y debemos recuperarla.' },
        { speaker: 'Profesor G', text: '¿Logras encontrar la referencia del versículo?' }
    ];

    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';

        const quote = document.createElement('blockquote');
        quote.textContent = '„Busqué a Jehová, y él me oyó, y me libró de todos mis temores.”';
        contentArea.appendChild(quote);

        const container = document.createElement('div');
        container.className = 'dropdown-container';

        const selBook = document.createElement('select');
        [
            'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio',
            'Josué', 'Jueces', 'Rut',
            '1 Samuel', '2 Samuel', '1 Reyes', '2 Reyes',
            '1 Crónicas', '2 Crónicas', 'Esdras', 'Nehemías', 'Ester',
            'Job', 'Salmos', 'Proverbios', 'Eclesiastés', 'Cantares',
            'Isaías', 'Jeremías', 'Lamentaciones', 'Ezequiel', 'Daniel',
            'Oseas', 'Joel', 'Amós', 'Abdías', 'Jonás', 'Miqueas',
            'Nahúm', 'Habacuc', 'Sofonías', 'Hageo', 'Zacarías', 'Malaquías',
            'Mateo', 'Marcos', 'Lucas', 'Juan',
            'Hechos',
            'Romanos', '1 Corintios', '2 Corintios',
            'Gálatas', 'Efesios', 'Filipenses', 'Colosenses',
            '1 Tesalonicenses', '2 Tesalonicenses',
            '1 Timotei', '2 Timotei', 'Tito', 'Filemón',
            'Hebreos', 'Santiago',
            '1 Pedro', '2 Pedro',
            '1 Juan', '2 Juan', '3 Juan',
            'Judas',
            'Apocalipsis'
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

        const btn = createButton('Verificar', () => {
            if (selBook.value === 'Salmos' && selChap.value == '34' && selVerse.value == '4') {
                saveState(STAGES.STAGE_6);
                renderStage(STAGES.STAGE_6);
            } else {
                showFeedback('El dispositivo indica que es incorrecto. Sigue buscando.', true);
            }
        });
        btn.style.marginTop = '20px';
        contentArea.appendChild(btn);
    });
}

function runStage6() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: '¡Lo encontraste!' },
        { speaker: 'Profesor G', text: 'Me alegra, porque realmente es un versículo hermoso.' },
        { speaker: 'Profesor G', text: 'Espero que lo guardes en tu corazón este año.' },
        { speaker: 'Profesor G', text: 'Que el Señor te guarde y te colme de todas sus bendiciones.' },
        { speaker: 'Profesor G', text: 'Ahora sigamos adelante...' },
        { speaker: 'Profesor G', text: 'El siguiente sitio web que corrompió fue Youtube.com.' },
        { speaker: 'Profesor G', text: 'Observo que pasó por un video musical y borró algunas palabras de la letra.' },
        { speaker: 'Profesor G', text: 'Estoy convencido de que eres la persona adecuada.' },
        { speaker: 'Profesor G', text: 'Sé que encontrarás con facilidad las palabras que faltan.' },
        { speaker: 'Profesor G', text: 'Aquí tienes la letra:' }
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

        const btn = createButton('Verificar', () => {
            const val1 = document.getElementById('lyric1').value.trim().toLowerCase();
            const val2 = document.getElementById('lyric2').value.trim().toLowerCase();

            const valid1 = (val1 === 'odihna' || val1 === 'odihnă');
            const valid2 = (val2 === 'pace');

            if (valid1 && valid2) {
                saveState(STAGES.STAGE_7);
                renderStage(STAGES.STAGE_7);
            } else {
                showFeedback('Algo no está bien...', true);
            }
        });
        btn.style.marginTop = '20px';
        contentArea.appendChild(btn);
    });
}

function runStage7() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: 'Perfecto, ni siquiera me preocupaba que no lo lograras :)' },
        { speaker: 'Profesor G', text: 'Muy bonita la canción y la interpretación ;)' },
        { speaker: 'Profesor G', text: 'Ahora que hemos reparado el daño, sigamos adelante.' },
        { speaker: 'Profesor G', text: 'Mi aparato indica el último sitio web corrupto: Google Maps.' },
        { speaker: 'Profesor G', text: 'He logrado encontrar la ubicación donde creó una brecha.' },
        { speaker: 'Profesor G', text: 'Para cerrar la brecha, debo saber el nombre de la calle donde fue creada.' },
        { speaker: 'Profesor G', text: 'Tengo el presentimiento de que sabrás el nombre de esta calle:' }
    ];

    playDialogueSequence(d, () => {
        contentArea.innerHTML = '';
        const img = document.createElement('img');
        img.src = 'img/map.webp';
        img.className = 'game-img';
        contentArea.appendChild(img);

        const inp = createInput('¿Qué calle es?');
        contentArea.appendChild(inp);

        const btn = createButton('Verificar', () => {
            const v = inp.value.trim().toLowerCase();
            const valid = ['calle de rusia', 'calle rusia', 'c. rusia', 'c. de rusia', 'c rusia', 'c de rusia', 'c.rusia', 'rusia'].includes(v);

            if (valid) {
                saveState(STAGES.FINAL);
                renderStage(STAGES.FINAL);
            } else {
                showFeedback('Nop, no es esa...', true);
            }
        });
        contentArea.appendChild(btn);
    });
}

function runFinal() {
    hideDialogue();
    const d = [
        { speaker: 'Profesor G', text: '¡Perfecto! ¡Ese era el nombre de la calle!' },
        { speaker: 'Profesor G', text: 'Ahora recuerdo perfectamente:' },
        { speaker: 'Profesor G', text: 'Pasé varios años en ese lugar, qué hermosos recuerdos...' },
        { speaker: 'Profesor G', text: 'Por fin hemos reparado todos los daños dejados atrás.' },
        { speaker: 'Profesor G', text: 'Te agradezco toda la ayuda ofrecida.' },
        { speaker: 'Profesor G', text: 'Ahora puedo estar tranquilo sabiendo que internet está a salvo.' },
        { speaker: 'Profesor G', text: 'Mucho éxito y aléjate de cualquier tipo de virus :))' }
    ];
    playDialogueSequence(d, () => {
        hideDialogue();
        contentArea.innerHTML = '<h1 style="color: var(--success-color); font-size: 3rem;">FIN</h1>';

        const bigReset = createButton('Reiniciar Historia', fullReset);
        bigReset.style.marginTop = '40px';
        contentArea.appendChild(bigReset);

        resetBtn.classList.add('hidden');
    });
}
