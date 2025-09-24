const API_BASE = '/api/restaurants';

let restaurants = [];
let hasVoted = false;
let isLoading = false;

const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function handleError(error, context = '') {
    console.error(`Erreur ${context}:`, error);
    showError(`Erreur ${context}: ${error.message || 'Problème de connexion'}`);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();

    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.children[1]);

    setTimeout(() => errorDiv.remove(), 5000);
}

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erreur ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Impossible de contacter le serveur');
        }
        throw error;
    }
}

async function loadRestaurants() {
    setLoading(true);
    try {
        const response = await apiCall('');
        restaurants = response.data || [];
        renderRestaurants();
    } catch (error) {
        handleError(error, 'lors du chargement');
    } finally {
        setLoading(false);
    }
}

async function addRestaurant() {
    const input = document.getElementById('restaurantInput');
    const name = ucfirst(input.value.trim());

    if (!name) return;


    if (restaurants.some(r => r.name.toLowerCase() === name.toLowerCase())) {
        showError('Il existe déjà !');
        return;
    }

    setLoading(true);
    try {
        await apiCall('', {
            method: 'POST',
            body: JSON.stringify({ name })
        });

        input.value = '';
        await loadRestaurants();
    } catch (error) {
        handleError(error, 'lors de l\'ajout');
    } finally {
        setLoading(false);
    }
}

async function vote(id) {
    if (hasVoted || isLoading) return;

    setLoading(true);
    try {
        await apiCall(`/${id}/vote`, {
            method: 'POST'
        });

        setVotedCookie();
        await loadRestaurants();
    } catch (error) {
        handleError(error, 'lors du vote');
    } finally {
        setLoading(false);
    }
}

function setLoading(loading) {
    isLoading = loading;
    const addButton = document.querySelector('.btn');
    const voteButtons = document.querySelectorAll('.vote-btn');

    addButton.disabled = loading;
    voteButtons.forEach(btn => btn.disabled = loading || hasVoted);

    if (loading && restaurants.length === 0) {
        document.getElementById('restaurantsList').innerHTML =
            '<div class="loading">Chargement...</div>';
    }
}

function checkVotingStatus() {
    hasVoted = document.cookie.includes('hasVoted=true');
}

function setVotedCookie() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.cookie = `hasVoted=true; expires=${tomorrow.toUTCString()}; path=/`;
    hasVoted = true;
}

function renderRestaurants() {
    const container = document.getElementById('restaurantsList');

    if (restaurants.length === 0) {
        container.innerHTML = '<div class="no-item">Rien de proposé pour le moment</div>';
        return;
    }

    const sortedRestaurants = [...restaurants].sort((a, b) => b.votes - a.votes);

    container.innerHTML = sortedRestaurants.map(restaurant => `
        <div class="restaurant-item">
            <div class="restaurant-name">${restaurant.name}</div>
            <div class="vote-section">
                <div class="vote-count">${restaurant.votes} vote${restaurant.votes !== 1 ? 's' : ''}</div>
                <button class="vote-btn" ${isLoading || hasVoted ? 'disabled' : ''} onclick="vote(${restaurant.id})">Voter</button>
            </div>
        </div>
    `).join('');
}

async function init() {
    checkVotingStatus();
    await loadRestaurants();
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('restaurantInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !isLoading) {
            addRestaurant();
        }
    });

    init();
});
