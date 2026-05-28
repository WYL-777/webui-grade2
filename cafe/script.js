// form
function reserve() {
    // Get the values from the form inputs
    const name = document.getElementById('guestName').value;
    const count = document.getElementById('guestCount').value;

    // Make the reservation (this is just a simulation)
    const result = document.getElementById('reserveResult');

    // If the name or number of people is empty, display a warning message and exit.
    if (name === '' || count === '') {
        result.textContent = 'Please enter your name.';
        return;
    } else {
        result.textContent = `Reservation for ${name} with ${count} guests has been made! Thank you for your reservation`;
    }
}

// recommend
function pickRecommend() {
    const items = [
        'coffee',
        'Americano',
        'latte',
        'cappuccino',
        'pastry',
        'croissant',
        'muffin'
    ];
    
    const i = Math.floor(Math.random() * items.length);

    document.getElementById('recommendResult').textContent = items[i];
}

// theme Define some themes with main, accent, and background colors
const themes = [
  { name: 'coffee', main: '#78350F', accent: '#F59E0B', bg: '#FFFBEB' },
  { name: 'forest', main: '#15803D', accent: '#F97316', bg: '#F0FDF4' },
  { name: 'sunset', main: '#DB2777', accent: '#7C3AED', bg: '#FDF2F8' },
  { name: 'ocean',  main: '#0369A1', accent: '#FBBF24', bg: '#F0F9FF' },
];

let themeIndex = 0;

function toggleTheme() {
    console.log('Toggling theme');

    themeIndex = (themeIndex + 1) % themes.length;

    // 今のテーマを取り出す
    const theme = themes[themeIndex];

  // CSS変数（--main-color など）を上書きして、ページ全体の色を変える
    document.documentElement.style.setProperty('--main-color', theme.main);
    document.documentElement.style.setProperty('--accent-color', theme.accent);
    document.documentElement.style.setProperty('--bg-color', theme.bg);
}

// ========================================
// localStorage アクセスカウンター
// ========================================

function countVisit() {
    let count = localStorage.getItem('visitCount');

    if (count === null) {
        count = 0;
    } else {
        count = Number(count);
    }
    count = count + 1;
    
    localStorage.setItem('visitCount', count);
    document.getElementById('visitCount').textContent = count;
}
countVisit();