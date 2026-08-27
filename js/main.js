const uploadBtn = document.getElementById("uploadBtn");
const selectPhotosBtn = document.getElementById("selectPhotosBtn");
const uploadPhotosBtn = document.getElementById("uploadPhotosBtn");
const galleryBtn = document.getElementById("galleryBtn");
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
if(uploadBtn) {
    uploadBtn.addEventListener("click", () => {

        document
            .getElementById("uploadSection")
            .scrollIntoView({
                behavior: "smooth"
            });

    });
}


if(galleryBtn) {
    galleryBtn.addEventListener("click", () => {

        document
            .getElementById("albumSection")
            .scrollIntoView({
                behavior: "smooth"
            });

    });
}


// ================================
// OPEN FILE PICKER
// ================================
if(selectPhotosBtn) {
    selectPhotosBtn.addEventListener("click", () => {

        photoInput.click();

    });
}


// ================================
// PHOTO SELECTED
// ================================
if(photoInput) {
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
}


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
if(uploadPhotosBtn) {   
    uploadPhotosBtn.addEventListener(
        "click",
        uploadPhotos
    );
}


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


function shuffleArray(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );


        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];

    }

}

// ================================
// WEDDING ALBUM
// ================================

const albumGallery =
    document.getElementById("albumGallery");

const albumLoading =
    document.getElementById("albumLoading");

const loadMoreBtn =
    document.getElementById("loadMoreBtn");

const albumStatus =
    document.getElementById("albumStatus");


// Number of photos shown at once

const PHOTOS_PER_LOAD = 8;


// All photos from Google Drive

let allAlbumPhotos = [];


// Current number displayed

let displayedPhotos = 0;


// ================================
// LOAD ALBUM
// ================================

async function loadAlbum() {

    try {

        albumLoading.style.display = "block";

        albumGallery.innerHTML = "";

        albumStatus.textContent = "";


        const response =
            await fetch(
                API_URL + "?action=album"
            );


        const result =
            await response.json();


        console.log(
            "Album response:",
            result
        );


        if (result.status !== "success") {

            throw new Error(
                result.message ||
                "Failed to load album."
            );

        }


        allAlbumPhotos =
            shuffleArray(
                result.photos || []
            );


        displayedPhotos = 0;


        albumLoading.style.display =
            "none";


        showMorePhotos();


    } catch (error) {

        console.error(
            "Album error:",
            error
        );


        albumLoading.style.display =
            "none";


        albumStatus.textContent =
            "Unable to load the wedding album.";

    }

}


// ================================
// SHOW MORE PHOTOS
// ================================

function showMorePhotos() {

    const nextPhotos =
        allAlbumPhotos.slice(
            displayedPhotos,
            displayedPhotos +
            PHOTOS_PER_LOAD
        );


    nextPhotos.forEach(
        photo => {

            const photoItem =
                document.createElement("div");


            photoItem.className =
                "album-photo";


            photoItem.innerHTML = `

            <img
                src="${photo.url}"
                alt="Wedding photo"
                loading="lazy"
            >

            <div class="photo-uploader">
                📸 ${photo.guestName || "Anonymous"}
            </div>

        `;


            albumGallery.appendChild(
                photoItem
            );

        }
    );


    displayedPhotos +=
        nextPhotos.length;


    // Show / hide Load More

    if (displayedPhotos < allAlbumPhotos.length) {

        loadMoreBtn.style.display =
            "block";

    } else {

        loadMoreBtn.style.display =
            "none";

    }


    if (
        allAlbumPhotos.length === 0
    ) {

        albumStatus.textContent =
            "No photos have been uploaded yet.";

    }

}


// ================================
// LOAD MORE BUTTON
// ================================
if(loadMoreBtn) {
    loadMoreBtn.addEventListener(
        "click",
        showMorePhotos
    );
}


// ================================
// RANDOMIZE PHOTOS
// ================================

function shuffleArray(array) {

    const shuffled =
        [...array];


    for (
        let i = shuffled.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            shuffled[i],
            shuffled[j]
        ] = [
            shuffled[j],
            shuffled[i]
        ];

    }


    return shuffled;

}


// ================================
// LOAD ALBUM WHEN PAGE LOADS
// ================================

loadAlbum();