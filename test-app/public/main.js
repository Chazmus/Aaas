document.addEventListener("DOMContentLoaded", function () {
    const contentDiv = document.getElementById('content');
    
    // Load the home content (default)
    function loadHome() {
        contentDiv.innerHTML = `
            <h1>Welcome to the Home Page</h1>
            <p>This is the homepage of our simple SPA.</p>
        `;
    }

    // Function to load admin content via AJAX
    function loadAdmin() {
        fetch('/admin')
            .then(response => response.text())
            .then(html => {
                contentDiv.innerHTML = html;
            })
            .catch(err => {
                console.error('Error loading admin content:', err);
                contentDiv.innerHTML = '<p>Failed to load admin content.</p>';
            });
    }

    // Event listeners for navigation links
    document.getElementById('home-link').addEventListener('click', function (e) {
        e.preventDefault();
        loadHome();
    });

    document.getElementById('admin-link').addEventListener('click', function (e) {
        e.preventDefault();
        loadAdmin();
    });

    // Load the home page content by default when the page loads
    loadHome();
});
