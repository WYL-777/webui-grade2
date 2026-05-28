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
    
}