const uploadBtn = document.getElementById("uploadBtn");
const selectPhotosBtn = document.getElementById("selectPhotosBtn");
const uploadPhotosBtn = document.getElementById("uploadPhotosBtn");

const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const uploadStatus = document.getElementById("uploadStatus");

const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const guestNameInput = document.getElementById("guestName");


// ================================
// GOOGLE APPS SCRIPT URL
// ================================

const API_URL =
    "https://script.google.com/macros/s/AKfycbwtR88p2-eeHkdzCP-5oCpL7ot4e1f63U8wbyJ022GQg2YOHI2-jVuZCwW16IV-7TzfMg/exec";


// ================================
// VARIABLES
// ================================

let selectedFiles = [];


// ================================
// SCROLL TO UPLOAD
// ================================

uploadBtn.addEventListener("click", () => {

    document
        .getElementById("uploadSection")
        .scrollIntoView({
            behavior: "smooth"
        });

});


// ================================
// OPEN FILE PICKER
// ================================

selectPhotosBtn.addEventListener("click", () => {

    photoInput.click();

});


// ================================
// PHOTO SELECTED
// ================================

photoInput.addEventListener("change", (event) => {

    const files = Array.from(event.target.files);


    if (files.length === 0) {

        return;

    }


    if (files.length > 10) {

        alert(
            "You can upload a maximum of 10 photos at once."
        );

        photoInput.value = "";

        return;

    }


    // Validate file sizes

    const maxSize = 15 * 1024 * 1024;

    const tooLarge = files.some(
        file => file.size > maxSize
    );


    if (tooLarge) {

        alert(
            "Each photo must be smaller than 15 MB."
        );

        photoInput.value = "";

        return;

    }


    selectedFiles = files;

    displayPhotos();

});


// ================================
// DISPLAY PHOTOS
// ================================

function displayPhotos() {

    photoPreview.innerHTML = "";


    selectedFiles.forEach((file, index) => {

        const reader = new FileReader();


        reader.onload = function(event) {

            const photoContainer =
                document.createElement("div");


            photoContainer.classList.add(
                "photo-item"
            );


            photoContainer.innerHTML = `
                <img
                    src="${event.target.result}"
                    alt="Selected wedding photo"
                >

                <button
                    class="remove-photo"
                    onclick="removePhoto(${index})">
                    ×
                </button>
            `;


            photoPreview.appendChild(
                photoContainer
            );

        };


        reader.readAsDataURL(file);

    });


    uploadStatus.textContent =
        `${selectedFiles.length} photo${
            selectedFiles.length > 1 ? "s" : ""
        } selected`;


    uploadPhotosBtn.disabled =
        selectedFiles.length === 0;

}


// ================================
// REMOVE PHOTO
// ================================

function removePhoto(index) {

    selectedFiles.splice(index, 1);

    displayPhotos();

}

// ================================
// UPLOAD PHOTOS
// ================================

uploadPhotosBtn.addEventListener(
    "click",
    uploadPhotos
);


async function uploadPhotos() {

    if (selectedFiles.length === 0) {
        return;
    }


    // =================================
    // LOCK WEBSITE
    // =================================

    uploadPhotosBtn.disabled = true;
    selectPhotosBtn.disabled = true;

    showUploadOverlay();


    const guestName =
        guestNameInput.value.trim() ||
        "Anonymous";


    let uploaded = 0;


    try {

        for (const file of selectedFiles) {

            // =================================
            // PREPARING
            // =================================

            overlayProgress.textContent =
                `Preparing photo ${uploaded + 1} of ${selectedFiles.length}...`;


            const compressedFile =
                await compressImage(file);


            const base64 =
                await fileToBase64(compressedFile);


            const payload = {

                file: base64,

                fileName: file.name,

                mimeType: "image/jpeg",

                guestName: guestName

            };


            // =================================
            // UPLOADING
            // =================================

            updateUploadProgress(
                uploaded,
                selectedFiles.length
            );


            const response =
                await fetch(API_URL, {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify(payload)

                });


            const responseText =
                await response.text();


            console.log(
                "Google Apps Script response:",
                responseText
            );


            let result;


            try {

                result =
                    JSON.parse(responseText);

            } catch (error) {

                console.error(
                    "Invalid response:",
                    responseText
                );

                throw new Error(
                    "Invalid response from Google Apps Script."
                );

            }


            if (result.status !== "success") {

                throw new Error(
                    result.message ||
                    "Upload failed."
                );

            }


            uploaded++;


            // =================================
            // UPDATE PROGRESS
            // =================================

            updateUploadProgress(
                uploaded,
                selectedFiles.length
            );

        }


        // =================================
        // COMPLETE
        // =================================

        overlayProgress.textContent =
            "❤️ All photos uploaded successfully!";


        overlayProgressBar.style.width =
            "100%";


        // Give user a moment to see 100%

        await new Promise(
            resolve =>
                setTimeout(resolve, 800)
        );


        // =================================
        // HIDE OVERLAY
        // =================================

        hideUploadOverlay();


        // =================================
        // RESET
        // =================================

        uploadStatus.textContent =
            `❤️ Thank you! ${uploaded} photo${
                uploaded > 1 ? "s" : ""
            } uploaded successfully.`;


        selectedFiles = [];

        photoPreview.innerHTML = "";

        guestNameInput.value = "";

        photoInput.value = "";


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );


        // =================================
        // HIDE OVERLAY ON ERROR
        // =================================

        hideUploadOverlay();


        uploadStatus.textContent =
            "Something went wrong while uploading. Please try again.";


        alert(
            "Upload failed. Please check your internet connection and try again."
        );

    }


    // =================================
    // UNLOCK WEBSITE
    // =================================

    uploadPhotosBtn.disabled = true;

    selectPhotosBtn.disabled = false;

}


// ================================
// COMPRESS IMAGE
// ================================

async function compressImage(file) {

    const image = await createImageBitmap(file);

    const maxWidth = 2000;
    const maxHeight = 2000;

    let width = image.width;
    let height = image.height;


    if (width > maxWidth || height > maxHeight) {

        const ratio = Math.min(
            maxWidth / width,
            maxHeight / height
        );

        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

    }


    const canvas =
        document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;


    const context =
        canvas.getContext("2d");

    context.drawImage(
        image,
        0,
        0,
        width,
        height
    );


    const blob =
        await new Promise(resolve => {

            canvas.toBlob(
                resolve,
                "image/jpeg",
                0.82
            );

        });


    return blob;

}


// ================================
// FILE → BASE64
// ================================

function fileToBase64(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload = () => {

                const result =
                    reader.result;

                const base64 =
                    result.split(",")[1];

                resolve(base64);

            };


            reader.onerror =
                reject;


            reader.readAsDataURL(file);

        }
    );

}

// ================================
// SHOW UPLOAD OVERLAY
// ================================

function showUploadOverlay() {

    uploadOverlay.classList.add("active");

    overlayProgress.textContent =
        "Preparing your photos...";

    overlayProgressBar.style.width =
        "0%";

}


// ================================
// UPDATE UPLOAD PROGRESS
// ================================

function updateUploadProgress(
    current,
    total
) {

    const percentage =
        Math.round((current / total) * 100);

    overlayProgress.textContent =
        `Uploading ${current} of ${total}...`;

    overlayProgressBar.style.width =
        `${percentage}%`;

}


// ================================
// HIDE UPLOAD OVERLAY
// ================================

function hideUploadOverlay() {

    uploadOverlay.classList.remove("active");

}