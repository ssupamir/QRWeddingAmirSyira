const uploadBtn = document.getElementById("uploadBtn");
const selectPhotosBtn = document.getElementById("selectPhotosBtn");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const uploadStatus = document.getElementById("uploadStatus");

let selectedFiles = [];


// Scroll to upload section
uploadBtn.addEventListener("click", () => {

    document.getElementById("uploadSection").scrollIntoView({
        behavior: "smooth"
    });

});


// Open file picker
selectPhotosBtn.addEventListener("click", () => {

    photoInput.click();

});


// When photos are selected
photoInput.addEventListener("change", (event) => {

    const files = Array.from(event.target.files);

    if (files.length === 0) {
        return;
    }

    // Maximum 20 photos
    if (files.length > 20) {

        alert("You can upload a maximum of 20 photos at once.");

        return;
    }

    selectedFiles = files;

    displayPhotos();

});


// Display selected photos
function displayPhotos() {

    photoPreview.innerHTML = "";

    selectedFiles.forEach((file, index) => {

        const reader = new FileReader();

        reader.onload = function(event) {

            const photoContainer = document.createElement("div");

            photoContainer.classList.add("photo-item");

            photoContainer.innerHTML = `
                <img src="${event.target.result}" alt="Selected wedding photo">

                <button
                    class="remove-photo"
                    onclick="removePhoto(${index})">
                    ×
                </button>
            `;

            photoPreview.appendChild(photoContainer);

        };

        reader.readAsDataURL(file);

    });

    uploadStatus.textContent =
        `${selectedFiles.length} photo${selectedFiles.length > 1 ? "s" : ""} selected`;

}


// Remove photo
function removePhoto(index) {

    selectedFiles.splice(index, 1);

    displayPhotos();

}