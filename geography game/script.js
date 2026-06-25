const flagImg = document.getElementById('flag-image');
const loadingText = document.getElementById('loading-text');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const scoreEl = document.getElementById('score');

let score = 0;
let correctCountry = null;

// Built-in country data (No internet required!)
const countriesData = [
    { name: { common: "Japan" }, flags: { png: "https://flagcdn.com/w320/jp.png" } },
    { name: { common: "Canada" }, flags: { png: "https://flagcdn.com/w320/ca.png" } },
    { name: { common: "Brazil" }, flags: { png: "https://flagcdn.com/w320/br.png" } },
    { name: { common: "Australia" }, flags: { png: "https://flagcdn.com/w320/au.png" } },
    { name: { common: "France" }, flags: { png: "https://flagcdn.com/w320/fr.png" } },
    { name: { common: "United Kingdom" }, flags: { png: "https://flagcdn.com/w320/gb.png" } },
    { name: { common: "South Africa" }, flags: { png: "https://flagcdn.com/w320/za.png" } },
    { name: { common: "India" }, flags: { png: "https://flagcdn.com/w320/in.png" } },
    { name: { common: "Mexico" }, flags: { png: "https://flagcdn.com/w320/mx.png" } },
    { name: { common: "Italy" }, flags: { png: "https://flagcdn.com/w320/it.png" } },
    { name: { common: "Egypt" }, flags: { png: "https://flagcdn.com/w320/eg.png" } },
    { name: { common: "Argentina" }, flags: { png: "https://flagcdn.com/w320/ar.png" } }
];

function startGame() {
    // Hide loading text and show flag elements
    if (loadingText) loadingText.style.display = 'none';
    flagImg.style.display = 'block';
    generateQuestion();
}

// Generate a random question
function generateQuestion() {
    nextBtn.classList.add('hidden');
    optionsContainer.innerHTML = '';

    // Pick 4 random distinct countries from our local list
    const shuffled = [...countriesData].sort(() => 0.5 - Math.random());
    const choices = shuffled.slice(0, 4);

    // Pick one as the correct answer
    correctCountry = choices[Math.floor(Math.random() * choices.length)];

    // Display the flag
    flagImg.src = correctCountry.flags.png;

    // Create choice buttons
    choices.forEach(country => {
        const button = document.createElement('button');
        button.innerText = country.name.common;
        button.addEventListener('click', () => checkAnswer(button, country));
        optionsContainer.appendChild(button);
    });
}

// Check if selected answer is correct
function checkAnswer(selectedButton, selectedCountry) {
    const buttons = optionsContainer.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);

    if (selectedCountry.name.common === correctCountry.name.common) {
        selectedButton.style.backgroundColor = '#28a745'; // Green
        score++;
        scoreEl.innerText = score;
    } else {
        selectedButton.style.backgroundColor = '#dc3545'; // Red
        // Show user the right answer
        buttons.forEach(btn => {
            if (btn.innerText === correctCountry.name.common) {
                btn.style.backgroundColor = '#28a745';
            }
        });
    }
    nextBtn.classList.remove('hidden');
}

nextBtn.addEventListener('click', generateQuestion);

// Kick off the game directly
startGame();