const video = document.getElementById('video');
const captureBtn = document.getElementById('captureBtn');
const canvas = document.getElementById('canvas');
const photoPreview = document.getElementById('photoPreview');
const entryForm = document.getElementById('entryForm');
const captionInput = document.getElementById('caption');
const category1Select = document.getElementById('category1');
const category2Select = document.getElementById('category2');
const entriesList = document.getElementById('entriesList');

// Subcategories mapping
const subcategories = {
  placeholder1: ['placeholder1A', 'placeholder1B', 'placeholder1C'],
  placeholder2: ['placeholder2A', 'placeholder2B', 'placeholder2C'],
  placeholder3: ['placeholder3A', 'placeholder3B', 'placeholder3C']
};

let entries = [];
let currentImageDataUrl = null;

// Access camera
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Camera API not supported or not available on this device/browser.');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    alert('Error accessing camera: ' + err.message);
  }
}

// Populate Category 2 based on Category 1 selection
category1Select.addEventListener('change', () => {
  const selectedCat1 = category1Select.value;
  category2Select.innerHTML = '<option value="" disabled selected>Select Category 2</option>';
  if (subcategories[selectedCat1]) {
    subcategories[selectedCat1].forEach(subcat => {
      const option = document.createElement('option');
      option.value = subcat;
      option.textContent = subcat;
      category2Select.appendChild(option);
    });
    category2Select.disabled = false;
  } else {
    category2Select.disabled = true;
  }
});

// Capture photo
captureBtn.addEventListener('click', () => {
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  currentImageDataUrl = canvas.toDataURL('image/png');
  photoPreview.src = currentImageDataUrl;
  photoPreview.style.display = 'block';
  entryForm.style.display = 'block';
  // Hide video and capture button after photo taken
  video.style.display = 'none';
  captureBtn.style.display = 'none';
});

// Handle form submission
entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentImageDataUrl) {
    alert('Please take a picture first.');
    return;
  }
  const caption = captionInput.value.trim();
  const category1 = category1Select.value;
  const category2 = category2Select.value;

  if (!caption || !category1 || !category2) {
    alert('Please fill in all fields.');
    return;
  }

  const entry = {
    image: currentImageDataUrl,
    caption,
    category1,
    category2
  };
  entries.push(entry);
  displayEntries();
  resetForNewEntry();
});

// Display saved entries
function displayEntries() {
  entriesList.innerHTML = '';
  entries.forEach((entry, index) => {
    const div = document.createElement('div');
    div.className = 'entry';
    div.innerHTML = `
      <img src="${entry.image}" alt="Entry ${index + 1}" />
      <strong>Caption:</strong> ${entry.caption}<br/>
      <strong>Category 1:</strong> ${entry.category1}<br/>
      <strong>Category 2:</strong> ${entry.category2}
    `;
    entriesList.appendChild(div);
  });
}

// Reset UI for new entry
function resetForNewEntry() {
  currentImageDataUrl = null;
  captionInput.value = '';
  category1Select.value = '';
  category2Select.innerHTML = '<option value="" disabled selected>Select Category 2</option>';
  category2Select.disabled = true;
  entryForm.style.display = 'none';
  photoPreview.style.display = 'none';
  video.style.display = 'block';
  captureBtn.style.display = 'inline-block';
}

// Initialize
resetForNewEntry();
startCamera();

// Export data as ZIP
const exportBtn = document.getElementById('exportBtn');

exportBtn.addEventListener('click', async () => {
  if (entries.length === 0) {
    alert('No entries to export.');
    return;
  }

  const zip = new JSZip();
  const metadata = [];

  entries.forEach((entry, index) => {
    // Convert data URL to binary and add image file
    const base64Data = entry.image.split(',')[1];
    zip.file(`image_${index + 1}.png`, base64Data, { base64: true });

    // Add metadata entry
    metadata.push({
      filename: `image_${index + 1}.png`,
      caption: entry.caption,
      category1: entry.category1,
      category2: entry.category2
    });
  });

  // Add metadata JSON file
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  try {
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'entries.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Error generating ZIP file: ' + err.message);
  }
});