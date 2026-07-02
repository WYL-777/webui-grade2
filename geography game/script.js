const flagImg = document.getElementById('flag-image');
const loadingText = document.getElementById('loading-text');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const scoreEl = document.getElementById('score');

let score = 0;
let correctCountry = null;
let countriesData = []; // Starts empty, will be filled by the API

// FETCH DATA FROM A STABLE, FREE PUBLIC API
async function fetchCountries() {
    try {
        // Using a highly reliable public dataset mirror (No API key required)
        const response = await fetch('https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-abbreviation.json');
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // BUG FIX: Ensure we map data to use 2-letter lowercase codes for flagcdn.com
        countriesData = data.map(country => ({
            name: { common: country.country },
            flags: { png: `https://flagcdn.com/w320/${country.abbreviation.toLowerCase()}.png` }
        }));
        
        // Hide loading text, reveal the flag, and start the game loop
        if (loadingText) loadingText.style.display = 'none';
        flagImg.style.display = 'block';
        generateQuestion();
    } catch (error) {
        console.error('Failed to fetch country data:', error);
        if (loadingText) {
            loadingText.innerHTML = '⚠️ API Error. Loading offline backup data instead...';
            loadingText.style.color = '#dc3545';
        }
        
        // Fallback mechanism if the internet/API fails completely
        useFallbackData();
    }
}

// Fallback function so the game NEVER completely breaks for a user
function useFallbackData() {
    countriesData = [
        { name: { common: "Japan" }, flags: { png: "https://flagcdn.com/w320/jp.png" } },
        { name: { common: "Canada" }, flags: { png: "https://flagcdn.com/w320/ca.png" } },
        { name: { common: "Brazil" }, flags: { png: "https://flagcdn.com/w320/br.png" } },
        { name: { common: "Australia" }, flags: { png: "https://flagcdn.com/w320/au.png" } }
    ];
    setTimeout(() => {
        if (loadingText) loadingText.style.display = 'none';
        flagImg.style.display = 'block';
        generateQuestion();
    }, 1500);
}

// Generate a random question
function generateQuestion() {
    nextBtn.classList.add('hidden');
    optionsContainer.innerHTML = '';

    // Guard clause to make sure data exists
    if (countriesData.length === 0) return;

    // Pick 4 random distinct countries from our fresh API list
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

// Call the API function to kick things off!
fetchCountries();