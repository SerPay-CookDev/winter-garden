// --- SUPABASE ---
const SUPABASE_URL = 'https://ofnoubelrbrfliensste.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_P3gioK4ZNtQ9p_6H4c2khA_X0GX_dY9';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// --- LOCALSTORAGE ---
const DB_KEYS = {
    PLANTS: 'winter_garden_plants',
    READINGS: 'winter_garden_readings',
    SETTINGS: 'winter_garden_settings'
};

let plants = JSON.parse(localStorage.getItem(DB_KEYS.PLANTS)) || [];
let readings = JSON.parse(localStorage.getItem(DB_KEYS.READINGS)) || [];
let settings = JSON.parse(localStorage.getItem(DB_KEYS.SETTINGS)) || {
    vacationMode: false
};

let climateChartInstance = null;
let currentPlantId = null;
let selectedCatalogPlant = null;
let searchTimer = null;

// --- ДЕФОЛТНЫЕ ДАННЫЕ ---
function seedInitialData() {
    if (plants.length === 0) {
        plants = [
            {
                id: '1',
                name: 'Фикус Атом',
                photo: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?q=80&w=400&auto=format&fit=crop',
                min_temp: 18,
                max_temp: 25,
                min_hum: 50,
                max_hum: 70,
                watering_freq: 1,
                light: 'Яркий свет',
                color: 'var(--card-green)'
            },
            {
                id: '2',
                name: 'Монстера',
                photo: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=400&auto=format&fit=crop',
                min_temp: 20,
                max_temp: 28,
                min_hum: 60,
                max_hum: 80,
                watering_freq: 2,
                light: 'Рассеянный свет',
                color: 'var(--card-blue)'
            },
            {
                id: '3',
                name: 'Сансевиерия',
                photo: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?q=80&w=400&auto=format&fit=crop',
                min_temp: 15,
                max_temp: 30,
                min_hum: 30,
                max_hum: 50,
                watering_freq: 1,
                light: 'Тень',
                color: 'var(--card-orange)'
            }
        ];

        saveData();
    }
}

function saveData() {
    localStorage.setItem(DB_KEYS.PLANTS, JSON.stringify(plants));
    localStorage.setItem(DB_KEYS.READINGS, JSON.stringify(readings));
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
}

// --- DOM ЭЛЕМЕНТЫ ---
const mainScreen = document.getElementById('main-screen');
const detailScreen = document.getElementById('detail-screen');
const plantList = document.getElementById('plant-list');
const addModal = document.getElementById('add-modal');
const settingsModal = document.getElementById('settings-modal');
const vacationToggle = document.getElementById('vacation-toggle');
const vacationBanner = document.getElementById('vacation-banner');

const plantSearch = document.getElementById('plant-search');
const searchResults = document.getElementById('plant-search-results');
const manualPlantBtn = document.getElementById('manual-plant-btn');
const manualPlantFields = document.getElementById('manual-plant-fields');
const newNameInput = document.getElementById('new-name');
const newPhotoInput = document.getElementById('new-photo');

// --- СПИСОК МОИХ РАСТЕНИЙ ---
function renderPlantList() {
    plantList.innerHTML = '';

    if (plants.length === 0) {
        plantList.innerHTML =
            '<p style="text-align:center; color:#888; margin-top:20px;">У вас пока нет растений. Добавьте первое!</p>';
        return;
    }

    const colors = [
        'var(--card-green)',
        'var(--card-blue)',
        'var(--card-orange)',
        'var(--card-purple)',
        'var(--card-pink)',
        'var(--card-grey)'
    ];

    plants.forEach((plant, index) => {
        const card = document.createElement('div');
        card.className = 'plant-card';
        card.style.backgroundColor = plant.color || colors[index % colors.length];

        const image = document.createElement('img');
        image.className = 'plant-card-img';
        image.src = plant.photo || '';
        image.alt = plant.name;
        image.onerror = () => {
            image.src = 'https://via.placeholder.com/60?text=%F0%9F%8C%B1';
        };

        const info = document.createElement('div');
        info.className = 'plant-card-info';

        const name = document.createElement('div');
        name.className = 'plant-card-name';
        name.textContent = plant.name;

        const watering = document.createElement('div');
        watering.className = 'plant-card-water';
        watering.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
            </svg>
            Полив: ${plant.watering_freq} раз(а) в нед.
        `;

        info.append(name, watering);

        const arrow = document.createElement('div');
        arrow.className = 'plant-card-btn';
        arrow.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
            </svg>
        `;

        card.append(image, info, arrow);
        card.addEventListener('click', () => openDetailScreen(plant.id));
        plantList.appendChild(card);
    });
}

// --- ЭКРАН ДЕТАЛЕЙ ---
function openDetailScreen(id) {
    currentPlantId = id;
    const plant = plants.find(item => String(item.id) === String(id));

    if (!plant) return;

    document.getElementById('detail-name').textContent = plant.name;
    document.getElementById('detail-img').src = plant.photo || '';
    document.getElementById('detail-photo-area').style.backgroundColor =
        plant.color || 'var(--card-green)';
    document.getElementById('detail-watering').textContent =
        `${plant.watering_freq} / нед`;
    document.getElementById('detail-light').textContent = plant.light;
    document.getElementById('detail-temp').textContent =
        `${plant.min_temp} - ${plant.max_temp} °C`;
    document.getElementById('detail-hum').textContent =
        `${plant.min_hum} - ${plant.max_hum} %`;

    document.getElementById('recommendation-box').classList.add('hidden');

    renderChart(id);

    mainScreen.classList.remove('active');
    detailScreen.classList.add('active');
}

document.getElementById('close-detail-btn').addEventListener('click', () => {
    detailScreen.classList.remove('active');
    mainScreen.classList.add('active');

    if (climateChartInstance) {
        climateChartInstance.destroy();
        climateChartInstance = null;
    }
});

// --- ГРАФИКИ ---
function renderChart(plantId) {
    const canvas = document.getElementById('climateChart');
    const ctx = canvas.getContext('2d');

    const plantReadings = readings
        .filter(item => String(item.plant_id) === String(plantId))
        .slice(-10);

    const labels = plantReadings.map(item => item.date);
    const tempData = plantReadings.map(item => item.temp);
    const humData = plantReadings.map(item => item.hum);

    if (climateChartInstance) {
        climateChartInstance.destroy();
    }

    if (labels.length === 0) {
        climateChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Нет данных'],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
        return;
    }

    climateChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Температура (°C)',
                    data: tempData,
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Влажность (%)',
                    data: humData,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: { size: 10 }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '°C',
                        font: { size: 10 }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '%',
                        font: { size: 10 }
                    },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

// --- ЭМУЛЯЦИЯ ДАТЧИКОВ ---
document.getElementById('emulate-sensor-btn').addEventListener('click', () => {
    const plant = plants.find(item => String(item.id) === String(currentPlantId));
    if (!plant) return;

    const tempOffset = (Math.random() - 0.5) * 10;
    const humOffset = (Math.random() - 0.5) * 20;

    let newTemp = Math.round(
        ((plant.min_temp + plant.max_temp) / 2 + tempOffset) * 10
    ) / 10;

    let newHum = Math.round(
        (plant.min_hum + plant.max_hum) / 2 + humOffset
    );

    newTemp = Math.max(10, Math.min(35, newTemp));
    newHum = Math.max(10, Math.min(100, newHum));

    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });

    readings.push({
        id: Date.now().toString(),
        plant_id: plant.id,
        temp: newTemp,
        hum: newHum,
        date: timeString
    });

    saveData();
    renderChart(plant.id);
    checkRecommendations(plant, newTemp, newHum);
});

// --- РЕКОМЕНДАЦИИ ---
function checkRecommendations(plant, temp, hum) {
    const recBox = document.getElementById('recommendation-box');
    const recText = document.getElementById('recommendation-text');
    const messages = [];

    if (temp > plant.max_temp) {
        messages.push(
            `Слишком жарко (${temp}°C). Уберите растение от батареи или включите кондиционер.`
        );
    } else if (temp < plant.min_temp) {
        messages.push(
            `Слишком холодно (${temp}°C). Переставьте растение в более теплое место.`
        );
    }

    if (hum > plant.max_hum) {
        messages.push(
            `Высокая влажность (${hum}%). Проветрите помещение, чтобы избежать гнили.`
        );
    } else if (hum < plant.min_hum) {
        messages.push(
            `Низкая влажность (${hum}%). Рекомендуется опрыскать листья водой.`
        );
    }

    if (messages.length > 0 && !settings.vacationMode) {
        recText.textContent = messages.join(' ');
        recBox.classList.remove('hidden');
    } else {
        recBox.classList.add('hidden');
    }
}

// --- ПОИСК РАСТЕНИЙ В SUPABASE ---
function clearCatalogSelection() {
    selectedCatalogPlant = null;
    manualPlantFields.classList.add('hidden');
    manualPlantBtn.classList.add('hidden');

    newNameInput.required = false;
    newPhotoInput.required = false;
}

function renderSearchResults(rows) {
    searchResults.replaceChildren();

    if (rows.length === 0) {
        const message = document.createElement('p');
        message.textContent = 'Растения не найдены.';
        searchResults.appendChild(message);
        manualPlantBtn.classList.remove('hidden');
        return;
    }

    rows.forEach(plant => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'plant-search-result';

        const image = document.createElement('img');
        image.src = plant.photo_url || '';
        image.alt = '';
        image.onerror = () => {
            image.style.display = 'none';
        };

        const name = document.createElement('span');
        name.textContent = plant.name;

        button.append(image, name);
        button.addEventListener('click', () => selectCatalogPlant(plant));
        searchResults.appendChild(button);
    });
}

function selectCatalogPlant(plant) {
    selectedCatalogPlant = plant;
    plantSearch.value = plant.name;
    searchResults.replaceChildren();
    manualPlantFields.classList.add('hidden');
    manualPlantBtn.classList.add('hidden');

    newNameInput.required = false;
    newPhotoInput.required = false;

    document.getElementById('new-temp-min').value = plant.min_temp ?? '';
    document.getElementById('new-temp-max').value = plant.max_temp ?? '';
    document.getElementById('new-hum-min').value = plant.min_hum ?? '';
    document.getElementById('new-hum-max').value = plant.max_hum ?? '';
    document.getElementById('new-watering').value = plant.watering_freq ?? '';

    if (plant.light) {
        document.getElementById('new-light').value = plant.light;
    }
}

async function searchCatalog(query) {
    const searchText = query.trim();

    if (!searchText) {
        searchResults.replaceChildren();
        manualPlantBtn.classList.add('hidden');
        return;
    }

    const { data, error } = await supabaseClient
        .from('plant_catalog')
        .select('id, name, photo_url, min_temp, max_temp, min_hum, max_hum, watering_freq, light')
        .ilike('name', `%${searchText}%`)
        .order('name')
        .limit(10);

    if (error) {
        console.error('Ошибка поиска растений:', error.message);
        searchResults.textContent =
            'Не удалось загрузить каталог. Проверьте настройки Supabase.';
        manualPlantBtn.classList.remove('hidden');
        return;
    }

    renderSearchResults(data || []);
}

plantSearch.addEventListener('input', () => {
    clearCatalogSelection();
    clearTimeout(searchTimer);

    const query = plantSearch.value;
    searchTimer = setTimeout(() => searchCatalog(query), 250);
});

manualPlantBtn.addEventListener('click', () => {
    selectedCatalogPlant = null;
    manualPlantFields.classList.remove('hidden');
    manualPlantBtn.classList.add('hidden');

    newNameInput.required = true;
    newPhotoInput.required = true;
    newNameInput.value = plantSearch.value.trim();
    newNameInput.focus();
});

// --- ДОБАВЛЕНИЕ РАСТЕНИЯ ---
document.getElementById('add-plant-btn').addEventListener('click', () => {
    addModal.classList.remove('hidden');
});

document.getElementById('cancel-add-btn').addEventListener('click', () => {
    addModal.classList.add('hidden');
    document.getElementById('add-plant-form').reset();
    clearCatalogSelection();
    searchResults.replaceChildren();
});

document.getElementById('add-plant-form').addEventListener('submit', event => {
    event.preventDefault();

    const source = selectedCatalogPlant;
    const name = source?.name || newNameInput.value.trim();
    const photo = source?.photo_url || newPhotoInput.value.trim();

    if (!name || !photo) {
        alert('Выберите растение из каталога или заполните название и ссылку на фото.');
        return;
    }

    const careValues = {
        min_temp: source?.min_temp ?? document.getElementById('new-temp-min').value,
        max_temp: source?.max_temp ?? document.getElementById('new-temp-max').value,
        min_hum: source?.min_hum ?? document.getElementById('new-hum-min').value,
        max_hum: source?.max_hum ?? document.getElementById('new-hum-max').value,
        watering_freq: source?.watering_freq ?? document.getElementById('new-watering').value
    };

    if (Object.values(careValues).some(value => value === '' || value == null)) {
        alert('Заполните все параметры ухода.');
        return;
    }

    const colors = [
        'var(--card-green)',
        'var(--card-blue)',
        'var(--card-orange)',
        'var(--card-purple)',
        'var(--card-pink)'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newPlant = {
        id: Date.now().toString(),
        name,
        photo,
        min_temp: Number(careValues.min_temp),
        max_temp: Number(careValues.max_temp),
        min_hum: Number(careValues.min_hum),
        max_hum: Number(careValues.max_hum),
        watering_freq: Number(careValues.watering_freq),
        light: source?.light || document.getElementById('new-light').value,
        color: randomColor
    };

    plants.push(newPlant);
    saveData();

    addModal.classList.add('hidden');
    document.getElementById('add-plant-form').reset();
    clearCatalogSelection();
    searchResults.replaceChildren();
    renderPlantList();
});

// --- УДАЛЕНИЕ РАСТЕНИЯ ---
document.getElementById('delete-plant-btn').addEventListener('click', () => {
    if (!confirm('Вы уверены, что хотите удалить это растение?')) return;

    plants = plants.filter(item => String(item.id) !== String(currentPlantId));
    readings = readings.filter(
        item => String(item.plant_id) !== String(currentPlantId)
    );

    saveData();
    detailScreen.classList.remove('active');
    mainScreen.classList.add('active');

    if (climateChartInstance) {
        climateChartInstance.destroy();
        climateChartInstance = null;
    }

    renderPlantList();
});

// --- НАСТРОЙКИ И РЕЖИМ «ОТПУСК» ---
document.getElementById('settings-btn').addEventListener('click', () => {
    vacationToggle.checked = settings.vacationMode;
    settingsModal.classList.remove('hidden');
});

document.getElementById('close-settings-btn').addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

vacationToggle.addEventListener('change', event => {
    settings.vacationMode = event.target.checked;
    saveData();
    updateVacationBanner();
});

function updateVacationBanner() {
    vacationBanner.classList.toggle('hidden', !settings.vacationMode);
}

// --- ИНИЦИАЛИЗАЦИЯ ---
function init() {
    seedInitialData();
    updateVacationBanner();
    renderPlantList();
}

if (
    window.matchMedia('(min-width: 769px) and (hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
    const sparkleColors = ['#222222', '#333333', '#444444', '#555555'];
    let lastSparkleTime = 0;

    document.addEventListener('pointermove', event => {
        const now = Date.now();

        if (now - lastSparkleTime < 45) return;
        lastSparkleTime = now;

        const sparkle = document.createElement('span');
        sparkle.className = 'sparkle';
        sparkle.style.left = `${event.clientX}px`;
        sparkle.style.top = `${event.clientY}px`;
        sparkle.style.setProperty(
            '--sparkle-color',
            sparkleColors[Math.floor(Math.random() * sparkleColors.length)]
        );

        document.body.appendChild(sparkle);
        sparkle.addEventListener('animationend', () => sparkle.remove());
    });
}

if (window.matchMedia('(min-width: 769px)').matches) {
    const messages = [
        'Скачайте сегодня',
        'Уход за растениями',
        'Легко и бесплатно'
    ];

    const messageElement = document.getElementById('promo-message');
    let currentMessage = 0;

    if (messageElement) {
        setInterval(() => {
            messageElement.classList.add('is-changing');

            setTimeout(() => {
                currentMessage = (currentMessage + 1) % messages.length;
                messageElement.textContent = messages[currentMessage];
                messageElement.classList.remove('is-changing');
            }, 300);
        }, 2500);
    }
}

init();
