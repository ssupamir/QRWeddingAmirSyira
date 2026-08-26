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


    if (files.length > 20) {

        alert(
            "You can upload a maximum of 20 photos at once."
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


    uploadPhotosBtn.disabled = true;
    selectPhotosBtn.disabled = true;


    const totalPhotos =
        selectedFiles.length;


    const guestName =
        guestNameInput.value.trim() ||
        "Anonymous";


    let uploaded = 0;


    // ================================
    // SHOW PROGRESS
    // ================================

    progressContainer.style.display = "block";

    progressBar.style.width = "0%";

    progressText.textContent =
        `0 of ${totalPhotos} photos uploaded`;


    try {

        for (const file of selectedFiles) {

            // ================================
            // PREPARING
            // ================================

            uploadStatus.textContent =
                `Preparing photo ${uploaded + 1} of ${totalPhotos}...`;


            const compressedFile =
                await compressImage(file);


            // ================================
            // CONVERT TO BASE64
            // ================================

            const base64 =
                await fileToBase64(compressedFile);


            // ================================
            // CREATE PAYLOAD
            // ================================

            const payload = {

                file: base64,

                fileName: file.name,

                mimeType: "image/jpeg",

                guestName: guestName

            };


            // ================================
            // UPLOADING
            // ================================

            uploadStatus.textContent =
                `Uploading photo ${uploaded + 1} of ${totalPhotos}...`;


            await fetch(API_URL, {

                method: "POST",

                mode: "no-cors",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body:
                    JSON.stringify(payload)

            });

            // ================================
            // PHOTO SUCCESS
            // ================================

            uploaded++;


            const progress =
                Math.round(
                    (uploaded / totalPhotos) * 100
                );

            progressBar.style.width =
                `${progress}%`;


            progressText.textContent =
                `${uploaded} of ${totalPhotos} photos uploaded`;


            uploadStatus.textContent =
                `Uploaded ${uploaded} of ${totalPhotos}...`;

        }


        // ================================
        // ALL DONE
        // ================================

        progressBar.style.width = "100%";


        progressText.textContent =
            `${totalPhotos} of ${totalPhotos} photos uploaded`;

        uploadStatus.textContent =
            `❤️ Thank you! ${totalPhotos} photo${
                totalPhotos > 1 ? "s" : ""
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


        uploadStatus.textContent =
            "⚠️ We couldn't confirm the upload.";


        alert(
            "We couldn't confirm the upload. Please check Google Drive before trying again."
        );

    }


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