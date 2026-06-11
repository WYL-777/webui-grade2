// 1. Select the HTML elements we need to interact with
const adviceText = document.getElementById('advice-text');
const adviceImg = document.getElementById('advice-img');
const adviceBtn = document.getElementById('advice-btn');

// 2. Create a function that fetches data from the API
async function getAdvice() {
    const url = 'https://api.adviceslip.com/advice';
    
    try {
        // Change text temporarily so the user knows it's loading
        adviceText.innerText = "Loading wisdom..."; 

        // Send the request to the API and wait for the response
        const response = await fetch(url);
        
        // Convert the raw response into usable JavaScript object (JSON)
        const data = await response.json();
        
        // Update the image with a random one using the advice ID to ensure it changes
        adviceImg.src = `https://picsum.photos/400/200?random=${data.slip.id}`;
        adviceImg.style.display = "block";

        // Extract the advice string from the JSON object
        // The API returns data like this: { slip: { id: 1, advice: "Text" } }
        adviceText.innerText = `"${data.slip.advice}"`;

    } catch (error) {
        // If something goes wrong (e.g., no internet), handle the error gracefully
        adviceText.innerText = "Oops! Couldn't fetch advice. Try again.";
        console.error("Error fetching data:", error);
    }
}

// 3. Tell the button to run the function whenever it is clicked
adviceBtn.addEventListener('click', getAdvice);