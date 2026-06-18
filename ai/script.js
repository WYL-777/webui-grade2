// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// The link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/Vqm9qRlNp/";

let model, webcam, labelContainer, maxPredictions;

// Load the image model and setup the webcam
async function init() {
    document.getElementById("top-match-alert").innerText = "Loading Model...";

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        // load the model and metadata
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Convenience function to setup a webcam (Higher res for cleaner scaling)
        const flip = true; // whether to flip the webcam
        webcam = new tmImage.Webcam(400, 400, flip); // width, height, flip
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        window.requestAnimationFrame(loop);

        // Clear previous state and append canvas to the DOM
        const container = document.getElementById("webcam-container");
        container.innerHTML = "";
        container.appendChild(webcam.canvas);
        
        document.getElementById("top-match-alert").innerText = "Analyzing Face...";
    } catch (error) {
        console.error(error);
        document.getElementById("top-match-alert").innerText = "Webcam error. Please allow camera permissions.";
    }
}

async function loop() {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

// run the webcam image through the image model
async function predict() {
    // predict can take in an image, video or canvas html element
    const prediction = await model.predict(webcam.canvas);
    
    let highestScore = -1;
    let topMatchName = "";

    // Maps model class names directly to the CSS ID targets in your HTML
    const keyMap = {
        "LEE MIN HO": "leeminho",
        "Brad Pitt": "bradpitt",
        "Leonardo Di Carprio": "leonardo",
        "Leonardo DiCaprio": "leonardo" 
    };

    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = prediction[i].probability;
        const elementKey = keyMap[className];

        // 1. Update the table row confidence numbers
        if (elementKey) {
            const scoreEl = document.getElementById(`score-${elementKey}`);
            if (scoreEl) {
                scoreEl.innerHTML = probability.toFixed(2);
            }

            // 2. Mirror the live full-size webcam frame into the small data table snapshots
            const row = document.getElementById(`row-${elementKey}`);
            if (row) {
                const miniCanvas = row.querySelector('.mini-snapshot');
                if (miniCanvas) {
                    const ctx = miniCanvas.getContext('2d');
                    miniCanvas.width = 40;
                    miniCanvas.height = 40;
                    ctx.drawImage(webcam.canvas, 0, 0, 40, 40);
                }
            }
        }

        // Keep track of who has the highest confidence score
        if (probability > highestScore) {
            highestScore = probability;
            topMatchName = className;
        }
    }

    // 3. Update the matching summary banner text at the bottom
    if (highestScore >= 0) {
        document.getElementById("top-match-alert").innerHTML = 
            `Current Top Match: <strong>${topMatchName}</strong> (${highestScore.toFixed(2)})`;
    }
}

