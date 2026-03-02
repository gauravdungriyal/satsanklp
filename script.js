document.addEventListener('DOMContentLoaded', () => {
    // State
    let quizData = [];
    let studentsData = [];
    let currentUser = null;
    let currentQuestionIndex = 0;
    let score = 0;
    let timer;
    let timeLeft = 60;
    let isQuizActive = true;
    let flashcardIndex = 0;
    let satsankalpDetails = {};

    // DOM Elements - Login
    const loginSection = document.getElementById('login-section');
    const loginForm = document.getElementById('login-form');
    const scholarIdInput = document.getElementById('scholar-id');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('password-toggle');
    const loginError = document.getElementById('login-error');

    // DOM Elements - Dashboard
    const dashboardSection = document.getElementById('dashboard-section');
    const dashStudentName = document.getElementById('dash-student-name');
    const dashScholarId = document.getElementById('dash-scholar-id');
    const dashClass = document.getElementById('dash-class');
    const dashEmail = document.getElementById('dash-email');
    const logoutBtn = document.getElementById('logout-btn');

    // Assigned Section
    const assignedSection = document.getElementById('assigned-satsankalp-section');
    const assignedText = document.getElementById('assigned-text');
    const assignedMeaning = document.getElementById('assigned-meaning');

    // Mode Selection Buttons
    const modeSelectionSection = document.getElementById('mode-selection-section');
    const startQuizActionBtn = document.getElementById('start-quiz-action-btn');
    const startFlashcardActionBtn = document.getElementById('start-flashcard-action-btn');

    // DOM Elements - App
    const appContainer = document.getElementById('app-container');
    const backToDashBtn = document.getElementById('back-to-dash-btn');
    const currentModeTitle = document.getElementById('current-mode-title');
    const quizSection = document.getElementById('quiz-section');
    const flashcardSection = document.getElementById('flashcard-section');
    const resultSection = document.getElementById('result-section');

    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const nextBtn = document.getElementById('next-btn');
    const progressText = document.getElementById('progress');
    const currentScoreText = document.getElementById('current-score');
    const timerText = document.getElementById('timer');
    const restartBtn = document.getElementById('restart-btn');

    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownNumber = document.getElementById('countdown-number');
    const viewAllSatsankalpBtn = document.getElementById('view-all-satsankalp-btn');
    const allSatsankalpSection = document.getElementById('all-satsankalp-section');
    const satsankalpList = document.getElementById('satsankalp-list');

    // Init Password Toggle
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        if (type === 'password') {
            passwordToggle.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
        } else {
            passwordToggle.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-linecap="round" stroke-linejoin="round"/>
                    <line x1="1" y1="1" x2="23" y2="23" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
        }
    });

    const explanationContainer = document.getElementById('explanation-container');
    const explanationText = document.getElementById('explanation-text');

    const flashcard = document.getElementById('flashcard');
    const fcFrontText = document.getElementById('fc-front-text');
    const fcBackText = document.getElementById('fc-back-text');
    const fcProgressText = document.getElementById('fc-progress');
    const prevFcBtn = document.getElementById('prev-fc-btn');
    const nextFcBtn = document.getElementById('next-fc-btn');

    const winnersContainer = document.getElementById('winners-container');
    const detailTooltip = document.getElementById('detail-tooltip');
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipMeaning = document.getElementById('tooltip-meaning');
    const tooltipProcess = document.getElementById('tooltip-process');

    // Audio Context
    const playCorrectSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
        }
    };

    // Initialization
    async function init() {
        try {
            const [studentsRes, quizRes, detailsRes] = await Promise.all([
                fetch('students.json'),
                fetch('quiz.json'),
                fetch('satsankalp_details.json')
            ]);
            studentsData = await studentsRes.json();
            quizData = await quizRes.json();
            satsankalpDetails = await detailsRes.json();

            checkSession();
        } catch (err) {
            console.error("Error loading data:", err);
        }
    }

    function checkSession() {
        const savedUser = localStorage.getItem('satsankalp_user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            showDashboard();
        } else {
            showLogin();
        }
    }

    function showLogin() {
        loginSection.classList.add('active');
        dashboardSection.classList.remove('active');
        appContainer.classList.add('hidden');
    }

    function showDashboard() {
        loginSection.classList.remove('active');
        dashboardSection.classList.add('active');
        appContainer.classList.add('hidden'); // Ensure app is hidden initially

        // Show assigned section and mode buttons
        assignedSection.classList.remove('hidden');
        modeSelectionSection.classList.remove('hidden');

        dashStudentName.textContent = `Welcome, ${currentUser.name}`;
        dashScholarId.textContent = `ID: ${currentUser.scholar_id}`;
        dashClass.textContent = `Class: ${currentUser.class}`;
        dashEmail.textContent = currentUser.email;

        displayAssignedSatsankalp();
    }

    function displayAssignedSatsankalp() {
        // Find or create assigned satsankalp for this student
        let assignment = localStorage.getItem(`assigned_s_${currentUser.scholar_id}`);
        if (!assignment) {
            // Randomly assign 1-18
            const randomId = Math.floor(Math.random() * 18) + 1;
            assignment = randomId.toString();
            localStorage.setItem(`assigned_s_${currentUser.scholar_id}`, assignment);
        }

        const detail = satsankalpDetails[assignment];
        if (detail) {
            assignedText.textContent = ` #${assignment}: ${detail.text}`;
            assignedMeaning.textContent = detail.meaning;
        }
    }

    // Login Logic
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const scholarId = scholarIdInput.value.trim();
        const password = passwordInput.value.trim();

        const user = studentsData.find(s => s.scholar_id === scholarId && s.password === password);

        if (user) {
            currentUser = user;
            localStorage.setItem('satsankalp_user', JSON.stringify(user));
            loginError.classList.add('hidden');
            showDashboard();
        } else {
            loginError.classList.remove('hidden');
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('satsankalp_user');
        currentUser = null;
        showLogin();
    });

    // Start Mode Buttons
    startQuizActionBtn.addEventListener('click', () => {
        isQuizActive = true;
        currentModeTitle.textContent = "Quiz Mode";

        // Hide the entire dashboard section
        dashboardSection.classList.add('hidden');
        dashboardSection.classList.remove('active');

        appContainer.classList.remove('hidden');
        quizSection.classList.add('active');
        flashcardSection.classList.remove('active');
        resultSection.classList.remove('active');

        shuffleArray(quizData);
        startStartCountdown();
    });

    function startStartCountdown() {
        countdownOverlay.classList.remove('hidden');
        let count = 3;

        const updateCount = () => {
            countdownNumber.textContent = count > 0 ? count : "Go!";
            countdownNumber.classList.remove('countdown-animation');
            void countdownNumber.offsetWidth; // Trigger reflow
            countdownNumber.classList.add('countdown-animation');

            if (count < 0) {
                setTimeout(() => {
                    countdownOverlay.classList.add('hidden');
                    initQuiz();
                }, 800);
                return;
            }

            count--;
            setTimeout(updateCount, 1000);
        };

        updateCount();
    }

    startFlashcardActionBtn.addEventListener('click', () => {
        isQuizActive = false;
        currentModeTitle.textContent = "Flashcard Mode";

        // Hide the entire dashboard section
        dashboardSection.classList.add('hidden');
        dashboardSection.classList.remove('active');

        appContainer.classList.remove('hidden');
        quizSection.classList.remove('active');
        flashcardSection.classList.add('active');
        resultSection.classList.remove('active');

        initFlashcards();
    });

    backToDashBtn.addEventListener('click', () => {
        appContainer.classList.add('hidden');
        allSatsankalpSection.classList.remove('active');
        allSatsankalpSection.classList.add('hidden');

        // Show dashboard again
        dashboardSection.classList.remove('hidden');
        dashboardSection.classList.add('active');

        clearInterval(timer);
    });

    viewAllSatsankalpBtn.addEventListener('click', () => {
        currentModeTitle.textContent = "All Satsankalp";

        dashboardSection.classList.add('hidden');
        dashboardSection.classList.remove('active');

        appContainer.classList.remove('hidden');
        allSatsankalpSection.classList.add('active');
        allSatsankalpSection.classList.remove('hidden');
        quizSection.classList.remove('active');
        flashcardSection.classList.remove('active');
        resultSection.classList.remove('active');

        initAllSatsankalp();
    });

    function initAllSatsankalp() {
        satsankalpList.innerHTML = '';
        Object.keys(satsankalpDetails).forEach(id => {
            const data = satsankalpDetails[id];
            const item = document.createElement('div');
            item.className = 'satsankalp-item-card';
            item.innerHTML = `
                <h2><span class="index-badge">${id}</span> SATSANKALP</h2>
                <div class="main-text">${data.text}</div>
                <div class="details-box">
                    <span class="meaning-label">Meaning</span>
                    <p class="meaning-text">${data.meaning}</p>
                </div>
            `;
            satsankalpList.appendChild(item);
        });
    }

    // Quiz Logic
    function initQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        updateScoreDisplay();
        showQuestion();
    }

    function showQuestion() {
        resetState();
        const question = quizData[currentQuestionIndex];
        questionText.textContent = question.question;
        progressText.textContent = `Question ${currentQuestionIndex + 1}/${quizData.length}`;

        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-btn');
            button.addEventListener('click', () => selectOption(index));
            optionsContainer.appendChild(button);
        });

        startTimer();
    }

    function resetState() {
        while (optionsContainer.firstChild) optionsContainer.removeChild(optionsContainer.firstChild);
        nextBtn.classList.add('hidden');
        explanationContainer.classList.add('hidden');
        clearInterval(timer);
        timeLeft = 15;
        if (timerText) {
            timerText.textContent = timeLeft;
            timerText.classList.remove('low-time');
        }
    }

    function startTimer() {
        timer = setInterval(() => {
            timeLeft--;
            if (timerText) {
                timerText.textContent = timeLeft;
                if (timeLeft <= 5) {
                    timerText.classList.add('low-time');
                }
            }
            if (timeLeft <= 0) {
                handleTimeout();
            }
        }, 1000);
    }

    function handleTimeout() {
        clearInterval(timer);
        const question = quizData[currentQuestionIndex];
        const buttons = optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true);

        // Highlight correct answer even on timeout
        buttons[question.answer].classList.add('correct');

        explanationText.textContent = "Time's up! " + question.explanation;
        explanationContainer.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        nextBtn.textContent = (currentQuestionIndex === quizData.length - 1) ? "See Results" : "Next Question";
    }

    function selectOption(selectedIndex) {
        clearInterval(timer);
        if (timerText) timerText.classList.remove('low-time');
        const question = quizData[currentQuestionIndex];
        const buttons = optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true);

        if (selectedIndex === question.answer) {
            buttons[selectedIndex].classList.add('correct');
            score++;
            updateScoreDisplay();
            playCorrectSound();
        } else {
            buttons[selectedIndex].classList.add('wrong');
            buttons[question.answer].classList.add('correct');
        }

        explanationText.textContent = question.explanation;
        explanationContainer.classList.remove('hidden');
        nextBtn.classList.remove('hidden');

        enhanceTextWithHover(questionText);
        buttons.forEach(btn => enhanceTextWithHover(btn));

        nextBtn.textContent = (currentQuestionIndex === quizData.length - 1) ? "See Results" : "Next Question";
    }

    function updateScoreDisplay() {
        if (currentScoreText) currentScoreText.textContent = score;
    }

    nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.length) {
            showQuestion();
        } else {
            showResults();
        }
    });

    function showResults() {
        quizSection.classList.remove('active');
        resultSection.classList.add('active');
        displayWinners();
    }

    function displayWinners() {
        const scholarId = currentUser.scholar_id;
        const bestScoreKey = `best_score_${scholarId}`;
        let bestScore = localStorage.getItem(bestScoreKey) || 0;

        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem(bestScoreKey, bestScore);
        }

        winnersContainer.innerHTML = `
            <div class="result-item">
                <p class="result-label">Your Score</p>
                <h1 class="result-score">${score}</h1>
            </div>
            <div class="result-item">
                <p class="result-label">Your Best Score</p>
                <h2 class="result-best">${bestScore}</h2>
            </div>
        `;
    }

    restartBtn.addEventListener('click', () => {
        resultSection.classList.remove('active');
        quizSection.classList.add('active');
        initQuiz();
    });

    // Flashcard Logic
    function initFlashcards() {
        flashcardIndex = 0;
        updateFlashcard();
    }

    function updateFlashcard() {
        const data = quizData[flashcardIndex];
        fcFrontText.textContent = data.question;
        fcBackText.textContent = data.explanation;
        fcProgressText.textContent = `Card ${flashcardIndex + 1}/${quizData.length}`;
        flashcard.classList.remove('flipped');
    }

    flashcard.addEventListener('click', () => flashcard.classList.toggle('flipped'));
    nextFcBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (flashcardIndex < quizData.length - 1) {
            flashcardIndex++;
            updateFlashcard();
        }
    });
    prevFcBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (flashcardIndex > 0) {
            flashcardIndex--;
            updateFlashcard();
        }
    });

    // Hover Details
    function enhanceTextWithHover(element) {
        const text = element.textContent;
        Object.keys(satsankalpDetails).forEach(id => {
            const detail = satsankalpDetails[id];
            if (text.includes(detail.text)) {
                element.innerHTML = element.innerHTML.replace(detail.text, `<span class="hover-detail" data-id="${id}">${detail.text}</span>`);
            }
        });
        const spans = element.querySelectorAll('.hover-detail');
        spans.forEach(span => {
            span.addEventListener('mouseenter', (e) => showHoverDetail(e, span.dataset.id));
            span.addEventListener('mouseleave', hideHoverDetail);
        });
    }

    function showHoverDetail(e, id) {
        const detail = satsankalpDetails[id];
        if (!detail) return;
        tooltipTitle.textContent = `Satsankalp Details #${id}`;
        tooltipMeaning.textContent = detail.meaning;
        tooltipProcess.innerHTML = detail.process.map(step => `<li>${step}</li>`).join('');
        detailTooltip.classList.remove('hidden');
    }

    function hideHoverDetail() {
        detailTooltip.classList.add('hidden');
    }

    document.addEventListener('mousemove', (e) => {
        if (!detailTooltip.classList.contains('hidden')) {
            const x = e.clientX + 15;
            const y = e.clientY + 15;
            const rect = detailTooltip.getBoundingClientRect();
            let finalX = x;
            let finalY = y;
            if (x + rect.width > window.innerWidth) finalX = e.clientX - rect.width - 15;
            if (y + rect.height > window.innerHeight) finalY = e.clientY - rect.height - 15;
            detailTooltip.style.left = finalX + 'px';
            detailTooltip.style.top = finalY + 'px';
        }
    });

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    init();
});
