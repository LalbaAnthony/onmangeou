let restaurants = [];
let hasVoted = false;

// Initialisation
function init() {
    loadData();
    checkVotingStatus();
    renderRestaurants();
}

// Chargement des données depuis localStorage
function loadData() {
    const stored = localStorage.getItem('restaurants');
    if (stored) {
        restaurants = JSON.parse(stored);
    }
}

// Sauvegarde des données
function saveData() {
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
}

// Vérification du statut de vote via cookies
function checkVotingStatus() {
    hasVoted = document.cookie.includes('hasVoted=true');
}

// Définition du cookie de vote
function setVotedCookie() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.cookie = `hasVoted=true; expires=${tomorrow.toUTCString()}; path=/`;
    hasVoted = true;
}

// Ajout d'un restaurant
function addRestaurant() {
    const input = document.getElementById('restaurantInput');
    const name = input.value.trim();

    if (!name) return;

    // Vérification des doublons
    if (restaurants.some(r => r.name.toLowerCase() === name.toLowerCase())) {
        alert('Ce restaurant existe déjà !');
        return;
    }

    restaurants.push({
        id: Date.now(),
        name: name,
        votes: 0
    });

    input.value = '';
    saveData();
    renderRestaurants();
}

// Vote pour un restaurant
function vote(id) {
    if (hasVoted) return;

    const restaurant = restaurants.find(r => r.id === id);
    if (restaurant) {
        restaurant.votes++;
        setVotedCookie();
        saveData();
        renderRestaurants();
    }
}

// Rendu de la liste des restaurants
function renderRestaurants() {
    const container = document.getElementById('restaurantsList');

    if (restaurants.length === 0) {
        container.innerHTML = '<div class="empty-state">Aucun restaurant proposé pour le moment</div>';
        return;
    }

    // Tri par nombre de votes décroissant
    const sortedRestaurants = [...restaurants].sort((a, b) => b.votes - a.votes);

    container.innerHTML = sortedRestaurants.map(restaurant => `
                <div class="restaurant-item">
                    <div class="restaurant-name">${restaurant.name}</div>
                    <div class="vote-section">
                        <div class="vote-count">${restaurant.votes}</div>
                        ${hasVoted ?
            '<div class="voted-message">Déjà voté</div>' :
            `<button class="vote-btn" onclick="vote(${restaurant.id})">Voter</button>`
        }
                    </div>
                </div>
            `).join('');
}

// Gestion de l'entrée clavier
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('restaurantInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addRestaurant();
        }
    });

    init();
});
