document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const STORAGE_KEY = 'my_app_spaces_v1';
    let apps = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
        { id: '1', name: 'Google', url: 'https://google.com', iconColor: 'linear-gradient(135deg, #4FACFE, #00F2FE)', iconInitial: 'G' },
        { id: '2', name: 'YouTube', url: 'https://youtube.com', iconColor: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)', iconInitial: 'Y' }
    ];
    let isEditMode = false;
    let draggedItem = null;
    let touchTimeout;

    // --- DOM Elements ---
    const gridContainer = document.getElementById('grid-container');
    const fabAdd = document.getElementById('fab-add');
    const editToggle = document.getElementById('edit-toggle');
    const modalOverlay = document.getElementById('modal-overlay');
    const itemForm = document.getElementById('item-form');
    const btnCancel = document.getElementById('btn-cancel');
    const btnDelete = document.getElementById('btn-delete');

    // Form inputs
    const itemIdInput = document.getElementById('item-id');
    const nameInput = document.getElementById('item-name');
    const urlInput = document.getElementById('item-url');
    const colorOptions = document.querySelectorAll('.color-option');
    let selectedColor = colorOptions[0].dataset.color;

    // --- Initialization ---
    renderApps();

    // --- Core Functions ---
    function saveApps() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
        renderApps();
    }

    function renderApps() {
        gridContainer.innerHTML = '';
        apps.forEach((app, index) => {
            const appEl = document.createElement('div');
            appEl.className = `app-item ${isEditMode ? 'shaking' : ''}`;
            appEl.draggable = true; // Enable drag API
            appEl.dataset.id = app.id;
            appEl.dataset.index = index;

            appEl.innerHTML = `
                <div class="app-icon" style="background: ${app.iconColor}">
                    ${app.iconInitial || app.name[0].toUpperCase()}
                    ${isEditMode ? '<div style="position:absolute; inset:0; background:rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;"><span class="material-icons-round" style="font-size:24px; color:white;">edit</span></div>' : ''}
                </div>
                <div class="app-name">${app.name}</div>
            `;

            // Event Listeners for Interaction
            appEl.addEventListener('click', (e) => handleAppClick(e, app));

            // Drag and Drop Events (Desktop)
            appEl.addEventListener('dragstart', handleDragStart);
            appEl.addEventListener('dragover', handleDragOver);
            appEl.addEventListener('drop', handleDrop);
            appEl.addEventListener('dragend', handleDragEnd);

            // Touch Events (Mobile Drag)
            appEl.addEventListener('touchstart', handleTouchStart, { passive: false });
            appEl.addEventListener('touchmove', handleTouchMove, { passive: false });
            appEl.addEventListener('touchend', handleTouchEnd);

            gridContainer.appendChild(appEl);
        });
    }

    function handleAppClick(e, app) {
        if (isEditMode) {
            e.preventDefault(); // Prevent navigation
            openModal(app);
        } else {
            // Normal click, let it bubble or navigate
            // Check if it's a valid URL, otherwise ensure protocol
            let url = app.url;
            if (!url.startsWith('http')) url = 'https://' + url;
            window.location.href = url;
        }
    }

    // --- Modal Logic ---
    function openModal(app = null) {
        modalOverlay.classList.remove('hidden');
        if (app) {
            document.getElementById('modal-title').innerText = 'Edit Item';
            itemIdInput.value = app.id;
            nameInput.value = app.name;
            urlInput.value = app.url;
            selectColor(app.iconColor);
            btnDelete.classList.remove('hidden');
            document.getElementById('preset-container').style.display = 'none'; // Hide presets in edit mode
        } else {
            document.getElementById('modal-title').innerText = 'Add New Item';
            itemForm.reset();
            itemIdInput.value = '';
            selectColor(colorOptions[0].dataset.color);
            btnDelete.classList.add('hidden');
            document.getElementById('preset-container').style.display = 'block'; // Show presets in add mode
        }
    }

    // Presets
    const appPresets = [
        { name: 'WhatsApp', url: 'whatsapp://', color: 'linear-gradient(135deg, #25D366, #128C7E)' },
        { name: 'Instagram', url: 'instagram://', color: 'linear-gradient(135deg, #833AB4, #FD1D1D)' },
        { name: 'Facebook', url: 'fb://', color: 'linear-gradient(135deg, #1877F2, #0055FF)' },
        { name: 'YouTube', url: 'vnd.youtube://', color: 'linear-gradient(135deg, #FF0000, #CC0000)' },
        { name: 'Twitter/X', url: 'twitter://', color: 'linear-gradient(135deg, #1DA1F2, #14171A)' },
        { name: 'Gmail', url: 'googlegmail://', color: 'linear-gradient(135deg, #EA4335, #D93025)' },
        { name: 'Telegram', url: 'tg://', color: 'linear-gradient(135deg, #0088cc, #005f8f)' },
        { name: 'Spotify', url: 'spotify://', color: 'linear-gradient(135deg, #1DB954, #191414)' }
    ];

    const presetContainer = document.createElement('div');
    presetContainer.id = 'preset-container';
    presetContainer.style.marginBottom = '20px';
    presetContainer.innerHTML = '<label style="display:block;color:var(--text-secondary);margin-bottom:8px;font-size:14px;">Quick Add Popular App</label>';

    const presetScroll = document.createElement('div');
    presetScroll.className = 'preset-scroll';
    // Add CSS for this dynamically or in style.css, doing inline for speed now but better in style.tbd
    // Let's rely on class in style.css, I will add it there next.

    appPresets.forEach(preset => {
        const chip = document.createElement('div');
        chip.className = 'preset-chip';
        chip.innerText = preset.name;
        chip.onclick = () => {
            nameInput.value = preset.name;
            urlInput.value = preset.url;
            selectColor(preset.color || colorOptions[0].dataset.color);
        };
        presetScroll.appendChild(chip);
    });

    presetContainer.appendChild(presetScroll);

    // Insert before the form fields (specifically before the first input-group)
    const firstInputGroup = document.querySelector('.input-group');
    itemForm.insertBefore(presetContainer, firstInputGroup);

    function closeModal() {
        modalOverlay.classList.add('hidden');
    }

    function selectColor(color) {
        selectedColor = color;
        colorOptions.forEach(opt => {
            if (opt.dataset.color === color) opt.classList.add('selected');
            else opt.classList.remove('selected');
        });
    }

    // --- Event Listeners ---
    fabAdd.addEventListener('click', () => openModal());
    editToggle.addEventListener('click', () => {
        isEditMode = !isEditMode;
        editToggle.style.background = isEditMode ? 'var(--primary-accent)' : 'var(--glass-bg)';
        renderApps(); // Re-render to add/remove shaking class
    });

    btnCancel.addEventListener('click', closeModal);

    // Select Color
    colorOptions.forEach(opt => {
        opt.addEventListener('click', () => selectColor(opt.dataset.color));
    });

    // Save
    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = itemIdInput.value;
        const name = nameInput.value;
        const url = urlInput.value;

        if (id) {
            // Update
            const index = apps.findIndex(a => a.id === id);
            if (index !== -1) {
                apps[index] = { ...apps[index], name, url, iconColor: selectedColor };
            }
        } else {
            // Create
            const newApp = {
                id: Date.now().toString(),
                name,
                url,
                iconColor: selectedColor,
                iconInitial: name[0].toUpperCase()
            };
            apps.push(newApp);
        }
        saveApps();
        closeModal();
    });

    // Delete
    btnDelete.addEventListener('click', () => {
        const id = itemIdInput.value;
        if (id) {
            if (confirm('Are you sure you want to delete this item?')) {
                apps = apps.filter(a => a.id !== id);
                saveApps();
                closeModal();
            }
        }
    });

    // --- Drag and Drop Logic (Desktop) ---
    function handleDragStart(e) {
        if (isEditMode) {
            // Only allow drag in edit mode? OR allow always? 
            // Usually edit mode is better for sorting primarily to avoid accidental drags
        }
        draggedItem = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.index);
        this.classList.add('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDrop(e) {
        e.stopPropagation(); // stops the browser from redirecting.
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = parseInt(this.dataset.index);

        if (fromIndex !== toIndex) {
            const item = apps.splice(fromIndex, 1)[0];
            apps.splice(toIndex, 0, item);
            saveApps();
        }
        return false;
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        draggedItem = null;
    }

    // --- Touch Drag Logic (Mobile Custom) ---
    // Simple implementation: swapping on drop
    let touchItem = null;
    let touchStartX = 0;
    let touchStartY = 0;

    function handleTouchStart(e) {
        // If not in edit mode, maybe long press trigger?
        // For now, let's require edit mode for reordering to avoid conflict with scrolling/clicking
        if (!isEditMode) return;

        touchItem = this;
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

        touchItem.classList.add('dragging');
        // Prevent scroll if we are definitely dragging
    }

    function handleTouchMove(e) {
        if (!touchItem || !isEditMode) return;
        e.preventDefault(); // Stop scrolling

        const touch = e.touches[0];
        // Visual feedback? Move the element physically?
        // Ideally we clone it or move it absolutley. 
        // For simplicity v1: We just track where the finger is.

        const elementUnderFinger = document.elementFromPoint(touch.clientX, touch.clientY);
        const closestAppItem = elementUnderFinger?.closest('.app-item');

        if (closestAppItem && closestAppItem !== touchItem) {
            // Swap visually? 
            // This is complex to do perfectly smoothly in vanilla JS without a library like SortableJS
            // But let's try a simple "swap data" approach when ending?
        }
    }

    function handleTouchEnd(e) {
        if (!touchItem || !isEditMode) return;

        const touch = e.changedTouches[0];
        const elementUnderFinger = document.elementFromPoint(touch.clientX, touch.clientY);
        const closestAppItem = elementUnderFinger?.closest('.app-item');

        if (closestAppItem && closestAppItem !== touchItem) {
            const fromIndex = parseInt(touchItem.dataset.index);
            const toIndex = parseInt(closestAppItem.dataset.index);

            // Move in array
            const item = apps.splice(fromIndex, 1)[0];
            apps.splice(toIndex, 0, item);
            saveApps();
        }

        touchItem.classList.remove('dragging');
        touchItem = null;
    }
});
