chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "getWordMeaning",
    title: "Get Meaning of '%s'",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "getWordMeaning" && info.selectionText) {
    const selectedWord = info.selectionText.trim().toLowerCase();
    
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${selectedWord}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        const definitions = data[0]?.meanings[0]?.definitions; // Get definitions
        const pronunciation = data[0]?.phonetics[0]?.text || ''; // Get pronunciation
        const synonyms = data[0]?.meanings[0]?.synonyms || []; // Get synonyms
        const antonyms = data[0]?.meanings[0]?.antonyms || []; // Get antonyms
        
        // Prepare content for the modal
        const definition1 = definitions[0]?.definition || 'No definition found.';
        const definition2 = definitions[1]?.definition || 'No second definition found.';
        const synonym = synonyms[0] || 'No synonym found.';
        const antonym = antonyms[0] || 'No antonym found.';

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (word, def1, def2, syn, ant, pronunciation) => {
            // Create a modal div
            let modal = document.createElement("div");
            modal.id = "word-meaning-modal";
            modal.style.position = "fixed";
            modal.style.top = "50%";
            modal.style.left = "50%";
            modal.style.transform = "translate(-50%, -50%)";
            modal.style.backgroundColor = "#fff";
            modal.style.color = "#333";
            modal.style.padding = "20px";
            modal.style.borderRadius = "10px";
            modal.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.2)";
            modal.style.zIndex = "10000";
            modal.style.maxWidth = "400px";
            modal.style.fontFamily = "Arial, sans-serif";
            modal.style.textAlign = "center";

            modal.innerHTML = `
              <h2 style="margin-top: 0;">${word}</h2>
              <p><strong>Pronunciation:</strong> ${pronunciation}</p>
              <p><strong>Definition 1:</strong> ${def1}</p>
              <p><strong>Definition 2:</strong> ${def2}</p>
              <p><strong>Synonym:</strong> ${syn}</p>
              <p><strong>Antonym:</strong> ${ant}</p>
              <button id="close-modal-btn" style="
                margin-top: 15px;
                padding: 8px 15px;
                background-color: #1e88e5;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
              ">Close</button>
            `;

            const existingModal = document.getElementById("word-meaning-modal");
            if (existingModal) {
              existingModal.remove();
            }

            document.body.appendChild(modal);

            // Close modal functionality
            document.getElementById("close-modal-btn").addEventListener("click", () => {
              modal.remove();
            });

           
          },
          args: [selectedWord, definition1, definition2, synonym, antonym, pronunciation]
        });
      })
      .catch(error => {
        console.error('Error fetching word meaning:', error);
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            alert('Error fetching definition.');
          },
        });
      });
  }
});
