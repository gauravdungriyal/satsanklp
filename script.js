document.addEventListener('DOMContentLoaded', () => {
    // State
    let quizData = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timer;
    let timeLeft = 60;
    let isQuizActive = true;
    let flashcardIndex = 0;
    const defaultStudents = [
        "AKANSHA RANA", "AMAN PRATAP SINGH", "AMIT TIWARI", "ARYAN TOMAR",
        "DEEPANSHI BHATT", "DOLLY VERMA", "GAURAV DUNGRIYAL", "GHANAN DIXIT",
        "GOURAV KUMAR", "MINAKSHI KUMARI", "MUKUND THAKUR", "PRAGYA MAURYA",
        "SAKSHI BANKHEDE", "SAKSHI PAL", "SANSKRITI AGRAWAL", "SAROJ PODDAR",
        "SNEHA PAL", "ADITYA SONI", "ASHUTOSH KUMAR", "AYUSH RAM TRIPATHI",
        "BHASKAR MALL", "GOURI", "KANAK SHARMA", "KULDEEP SINGH",
        "MIKKI JAISWAL", "NISHA BHARTI", "PRAGYA GUPTA", "PRATIK KUMAR SAH",
        "RESHAB KHATIWADA", "SAYON KOLEY", "SHREYA KASHYAP", "SHREYA SINGH",
        "SONU RATHOR", "SUDHANSHU BELWAL", "YADEV SINGH NISHAD"
    ].map(name => ({ name, score: 0 }));

    // Always start with the 35 default names and reset scores to 0 on refresh
    let students = [...defaultStudents];
    let highScore = localStorage.getItem('satsankalpHighScore') || 0;

    // DOM Elements
    const quizSection = document.getElementById('quiz-section');
    const flashcardSection = document.getElementById('flashcard-section');
    const resultSection = document.getElementById('result-section');

    const quizBtn = document.getElementById('quiz-btn');
    const flashcardBtn = document.getElementById('flashcard-btn');

    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const nextBtn = document.getElementById('next-btn');
    const progressText = document.getElementById('progress');
    const currentScoreText = document.getElementById('current-score');
    const restartBtn = document.getElementById('restart-btn');

    const timerText = document.getElementById('timer');
    const timerToggle = document.getElementById('timer-toggle');
    const manualTimerBtn = document.getElementById('manual-timer-btn');
    const explanationContainer = document.getElementById('explanation-container');
    const explanationText = document.getElementById('explanation-text');

    const flashcard = document.getElementById('flashcard');
    const fcFrontText = document.getElementById('fc-front-text');
    const fcBackText = document.getElementById('fc-back-text');
    const fcProgressText = document.getElementById('fc-progress');
    const prevFcBtn = document.getElementById('prev-fc-btn');
    const nextFcBtn = document.getElementById('next-fc-btn');

    const studentsList = document.getElementById('students-list');
    const addStudentBtn = document.getElementById('add-student-btn');
    const winnersContainer = document.getElementById('winners-container');

    // Audio Context for synthetic sound
    const playCorrectSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);

            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported or blocked');
        }
    };

    // Load Data
    renderStudents();
    fetch('quiz.json')
        .then(response => response.json())
        .then(data => {
            quizData = data;
            shuffleArray(quizData); // Shuffle questions on load
            initQuiz();
            initFlashcards();
        });

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Student Management
    function renderStudents() {
        studentsList.innerHTML = '';
        students.forEach((student, index) => {
            const item = document.createElement('div');
            item.className = 'student-item';
            item.innerHTML = `
                <span class="student-name">${student.name}</span>
                <span class="student-score">${student.score}</span>
            `;
            item.addEventListener('click', () => incrementStudentScore(index));
            studentsList.appendChild(item);
        });
        // Removed LocalStorage persistence to ensure changes disappear on refresh
    }

    function addStudent() {
        const name = prompt("Enter student name:");
        if (name && name.trim()) {
            students.push({ name: name.trim(), score: 0 });
            renderStudents();
        }
    }

    function incrementStudentScore(index) {
        students[index].score++;
        renderStudents();
    }

    addStudentBtn.addEventListener('click', addStudent);

    // Initialize Quiz
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

        if (timerToggle.checked) {
            startTimer();
        }
    }

    function resetState() {
        while (optionsContainer.firstChild) {
            optionsContainer.removeChild(optionsContainer.firstChild);
        }
        nextBtn.classList.add('hidden');
        explanationContainer.classList.add('hidden');
        clearInterval(timer);
        timeLeft = 60;
        timerText.textContent = timeLeft;
        manualTimerBtn.disabled = false;
    }

    function selectOption(selectedIndex) {
        clearInterval(timer);
        manualTimerBtn.disabled = true;
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

        if (currentQuestionIndex === quizData.length - 1) {
            nextBtn.textContent = "See Results";
        } else {
            nextBtn.textContent = "Next Question";
        }
    }

    function startTimer() {
        timerText.textContent = timeLeft;
        timer = setInterval(() => {
            timeLeft--;
            timerText.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timer);
                autoSelectWrong();
            }
        }, 1000);
    }

    function autoSelectWrong() {
        clearInterval(timer);
        manualTimerBtn.disabled = true;
        const question = quizData[currentQuestionIndex];
        const buttons = optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true);
        buttons[question.answer].classList.add('correct');

        explanationText.textContent = "Time Over! " + question.explanation;
        explanationContainer.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
    }

    manualTimerBtn.addEventListener('click', () => {
        manualTimerBtn.disabled = true;
        startTimer();
    });

    function updateScoreDisplay() {
        currentScoreText.textContent = score;
    }

    // Navigation
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

        // Hide personal score logic as requested, focusing on student winners
        displayWinners();
    }

    function displayWinners() {
        winnersContainer.innerHTML = '<h4>Winner List (Leaderboard)</h4>';
        const sortedStudents = [...students].sort((a, b) => b.score - a.score);
        const top3 = sortedStudents.slice(0, 3);

        if (top3.length === 0) {
            winnersContainer.innerHTML += '<p>No students added.</p>';
            return;
        }

        const ranks = ['first', 'second', 'third'];

        top3.forEach((student, index) => {
            const card = document.createElement('div');
            card.className = 'winner-card';
            card.innerHTML = `
                <div class="winner-rank ${ranks[index]}">${index + 1}</div>
                <div class="winner-info">
                    <span class="winner-name">${student.name}</span>
                    <span class="winner-score">${student.score} pts</span>
                </div>
            `;
            winnersContainer.appendChild(card);
        });
    }

    restartBtn.addEventListener('click', () => {
        resultSection.classList.remove('active');
        quizSection.classList.add('active');
        // Reset student scores for a new round
        students.forEach(s => s.score = 0);
        renderStudents();
        initQuiz();
    });

    // Mode Switching
    quizBtn.addEventListener('click', () => {
        quizBtn.classList.add('active');
        flashcardBtn.classList.remove('active');
        quizSection.classList.add('active');
        flashcardSection.classList.remove('active');
        resultSection.classList.remove('active');
        isQuizActive = true;
    });

    flashcardBtn.addEventListener('click', () => {
        flashcardBtn.classList.add('active');
        quizBtn.classList.remove('active');
        flashcardSection.classList.add('active');
        quizSection.classList.remove('active');
        resultSection.classList.remove('active');
        isQuizActive = false;
        clearInterval(timer);
    });

    // Flashcard Logic
    function initFlashcards() {
        flashcardIndex = 0;
        updateFlashcard();
    }

    function updateFlashcard() {
        const data = quizData[flashcardIndex];
        // We use the same data but show as flashcards
        fcFrontText.textContent = data.question;
        fcBackText.textContent = data.explanation;
        fcProgressText.textContent = `Card ${flashcardIndex + 1}/${quizData.length}`;
        flashcard.classList.remove('flipped');
    }

    flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('flipped');
    });

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

    timerToggle.addEventListener('change', () => {
        if (!timerToggle.checked && isQuizActive) {
            clearInterval(timer);
            timerText.textContent = "--";
        } else if (isQuizActive && timeLeft > 0) {
            // Restart if turned back on during active question
            startTimer();
        }
    });
});
