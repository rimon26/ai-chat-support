// Modal logic
const modalOpenBtn = document.querySelector(".bi-chat");
const modal = document.querySelector(".chat-modal");
const closeBtn = document.querySelector(".bi-x");

function openModal() {
  modal.style.display = "block";
  modalOpenBtn.classList.add("hidden");
}

function closeModal() {
  modal.style.display = "none";
  modalOpenBtn.classList.remove("hidden");
}

modalOpenBtn.addEventListener("click", () => {
  openModal();
});

closeBtn.addEventListener("click", () => {
  closeModal();
});

// API logics

const userInput = document.getElementById("input");
const sendBtn = document.querySelector("#send-btn");

const defaultText = document.querySelector(".default-text");
const chatBody = document.querySelector(".chat-body");

const imageInput = document.getElementById("imageInput");

// Helper: Convert image file to base64 string
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]); // remove data:*/*;base64,
    reader.onerror = (error) => reject(error);
  });
}

sendBtn.addEventListener("click", async () => {
  const input = userInput.value.trim();
  if (!input && !imageInput.files.length) return; // Require at least text or image

  defaultText.remove();

  const smallPrev = document.getElementById("small-prev");
  if (smallPrev) smallPrev.remove();
  // Show user text if exists
  if (input) {
    const userPrompt = document.createElement("p");
    userPrompt.className = "user-text";
    userPrompt.textContent = input;
    chatBody.appendChild(userPrompt);
  }

  // Show image preview (optional)
  if (imageInput.files.length) {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(imageInput.files[0]);
    img.style.alignSelf = "flex-end";
    img.style.maxWidth = "200px";
    img.style.margin = "0 0 10px";
    img.style.borderRadius = "10px";
    chatBody.appendChild(img);
  }

  // Convert image file to base64 if exists
  let base64Image = null;
  if (imageInput.files.length) {
    base64Image = await toBase64(imageInput.files[0]);
  }

  // Send prompt + image to API
  if (imageInput.files.length) {
    const file = imageInput.files[0];
    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      alert("Image too large! Max size is 5MB.");
      return;
    }
  }
  getReply(input, base64Image);

  userInput.value = "";
  imageInput.value = "";
  chatBody.scrollTop = chatBody.scrollHeight;
});

const chatInputSec = document.querySelector(".chat-input");
imageInput.addEventListener("change", () => {
  // Remove previous preview if exists
  const existingPreview = document.getElementById("small-prev");
  if (existingPreview) {
    existingPreview.remove();
  }

  // If a file is selected, create preview
  if (imageInput.files && imageInput.files[0]) {
    const smallPrev = document.createElement("img");
    smallPrev.id = "small-prev";
    smallPrev.src = URL.createObjectURL(imageInput.files[0]);
    // Insert the preview at the start of chat input section or wherever you want
    chatInputSec.insertBefore(smallPrev, chatInputSec.firstChild);
  }
});

// GetReply Function
async function getReply(input, base64Image = null) {
  const loader = document.createElement("div");
  loader.classList.add("ai-text", "loader");
  chatBody.appendChild(loader);
  sendBtn.setAttribute("disabled", "true");

  try {
    const payload = { prompt: input };
    if (base64Image) {
      payload.image = base64Image;
    }

    const res = await fetch("http://localhost:3001/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    loader.remove();
    sendBtn.removeAttribute("disabled");

    const aiReply = document.createElement("p");
    aiReply.className = "ai-text";
    chatBody.appendChild(aiReply);

    const rawReply = data.reply.trim();
    const plainText = rawReply.replace(/<\/?[^*>]+(>|$)/g, ""); // remove HTML for animation

    let index = 0;
    const typingSpeed = 20;

    const typeWriter = () => {
      if (index < plainText.length) {
        aiReply.textContent += plainText.charAt(index);
        index++;
        chatBody.scrollTop = chatBody.scrollHeight;
        setTimeout(typeWriter, typingSpeed);
      } else {
        aiReply.innerHTML = DOMPurify.sanitize(marked.parse(rawReply));
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    };

    typeWriter();
  } catch (error) {
    console.error("Fetch error:", error.message);
    loader.remove();
    sendBtn.removeAttribute("disabled");

    const errorMsg = document.createElement("p");
    errorMsg.className = "ai-text error";
    errorMsg.textContent = "❌ Something went wrong. Try again.";
    chatBody.appendChild(errorMsg);
  }
}
