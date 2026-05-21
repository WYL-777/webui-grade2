// form
function reserve() {
    const name = document.getElementById('guestName').value;
    const count = document.getElementById('guestCount').value;

    const result = document.getElementById('reserveResult');
    result.textContent = `Reservation for ${name} with ${count} guests has been made! Thank you for your reservation`;
}