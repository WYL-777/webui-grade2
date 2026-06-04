// document.getElementById('section1-btn')
//   .addEventListener('click', () => {

//   fetch('https://pokeapi.co/api/v2/pokemon/pikachu')
//     .then(res => res.json())
//     .then(data => {
//       document.getElementById('section1-result').textContent
//         = data.name + ' / HP:' + data.stats[0].base_stat;
//     });
// });
// document.getElementById('section1-btn')
//   .addEventListener('click', () => {

//   fetch('https://pokeapi.co/api/v2/pokemon/pikachu')
//     .then(res => res.json())
//     .then(data => {
//       document.getElementById('section1-result').textContent =
//   data.stats
//     .map(s => s.stat.name + ': ' + s.base_stat)
//     .join(' / ');
//     });
// });

async function getPokemon() {
    const name = document.getElementById('name').value;
    const url = `https://pokeapi.co/api/v2/pokemon/${name}`;

    const res = await fetch(url);
    const data = await res.json();

    const stats = data.stats
        .map(s => `<li>${s.stat.name}: ${s.base_stat}</li>`)
        .join('');

    document.getElementById('section1-result').innerHTML = `
        <img src="${data.sprites.front_default}" alt="${data.name}">
        <h3>${data.name}</h3>
        <ul>${stats}</ul>
    `;

}

document.getElementById('section1-btn').addEventListener('click', getPokemon);