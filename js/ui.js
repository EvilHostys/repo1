// UI Manager for CraftLauncher

class UIManager {
    constructor() {
        this.currentScreen = 'loading';
        this.currentSection = 'home';
        this.modals = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeModals();
        this.setupAnimations();
    }

    // Setup event listeners
    setupEventListeners() {
        // Auth tab switching
        document.querySelectorAll('.auth-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAuthTab(e.target.dataset.tab);
            });
        });

        // Settings tab switching
        document.querySelectorAll('.settings-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSettingsTab(e.target.dataset.tab);
            });
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Login buttons
        document.getElementById('login-offline')?.addEventListener('click', this.handleOfflineLogin.bind(this));
        document.getElementById('login-microsoft')?.addEventListener('click', this.handleMicrosoftLogin.bind(this));
        document.getElementById('login-mojang')?.addEventListener('click', this.handleMojangLogin.bind(this));

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', this.handleLogout.bind(this));

        // Play button
        document.getElementById('play-btn')?.addEventListener('click', this.handlePlayGame.bind(this));

        // Settings button
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showModal('settings-modal');
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        // Version filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterVersions(e.target.dataset.filter);
            });
        });

        // Settings inputs
        this.setupSettingsInputs();

        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    // Initialize modals
    initializeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.modals.set(modal.id, {
                element: modal,
                visible: false
            });
        });
    }

    // Setup animations
    setupAnimations() {
        // Add intersection observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fadeInUp');
                }
            });
        });

        document.querySelectorAll('.version-card, .news-card, .server-card').forEach(card => {
            observer.observe(card);
        });
    }

    // Switch authentication tab
    switchAuthTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.auth-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    // Switch settings tab
    switchSettingsTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.settings-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('#settings-modal .tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-settings`);
        });
    }

    // Switch main section
    switchSection(sectionName) {
        this.currentSection = sectionName;

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionName);
        });

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.toggle('active', section.id === `${sectionName}-section`);
        });

        // Load section-specific content
        this.loadSectionContent(sectionName);
    }

    // Load section-specific content
    loadSectionContent(sectionName) {
        switch (sectionName) {
            case 'versions':
                this.loadVersionsContent();
                break;
            case 'news':
                this.loadNewsContent();
                break;
            case 'servers':
                this.loadServersContent();
                break;
            case 'mods':
                this.loadModsContent();
                break;
            case 'skins':
                this.loadSkinsContent();
                break;
        }
    }

    // Handle offline login
    async handleOfflineLogin() {
        const username = document.getElementById('username').value.trim();
        
        if (!username) {
            Utils.showNotification('Please enter a username', 'error');
            return;
        }

        try {
            const loginBtn = document.getElementById('login-offline');
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

            await window.authManager.authenticateOffline(username);
            this.switchScreen('main');
            this.updateUserInfo();

        } catch (error) {
            Utils.showNotification(error.message, 'error');
        } finally {
            const loginBtn = document.getElementById('login-offline');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-play"></i> Play Offline';
        }
    }

    // Handle Microsoft login
    async handleMicrosoftLogin() {
        try {
            const loginBtn = document.getElementById('login-microsoft');
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

            await window.authManager.authenticateMicrosoft();
            this.switchScreen('main');
            this.updateUserInfo();

        } catch (error) {
            Utils.showNotification(error.message, 'error');
        } finally {
            const loginBtn = document.getElementById('login-microsoft');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fab fa-microsoft"></i> Login with Microsoft';
        }
    }

    // Handle Mojang login
    async handleMojangLogin() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            Utils.showNotification('Please enter email and password', 'error');
            return;
        }

        try {
            const loginBtn = document.getElementById('login-mojang');
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

            await window.authManager.authenticateMojang(email, password);
            this.switchScreen('main');
            this.updateUserInfo();

        } catch (error) {
            Utils.showNotification(error.message, 'error');
        } finally {
            const loginBtn = document.getElementById('login-mojang');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    }

    // Handle logout
    handleLogout() {
        window.authManager.logout();
        this.switchScreen('login');
        this.clearUserInfo();
    }

    // Handle play game
    async handlePlayGame() {
        const versionSelect = document.getElementById('version-select');
        const modLoaderSelect = document.getElementById('mod-loader');
        
        const versionId = versionSelect.value;
        const modLoader = modLoaderSelect.value === 'vanilla' ? null : modLoaderSelect.value;

        try {
            const playBtn = document.getElementById('play-btn');
            playBtn.disabled = true;
            playBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>LAUNCHING...</span>';

            // Check if version is installed
            if (!window.versionManager.isVersionInstalled(versionId)) {
                // Show download progress
                this.showModal('progress-modal');
                document.getElementById('progress-title').textContent = `Downloading Minecraft ${versionId}`;

                await window.downloadManager.downloadVersion(versionId, modLoader, (progress) => {
                    this.updateProgressModal(progress);
                });

                this.hideModal('progress-modal');
            }

            // Launch the game
            await window.gameLauncher.launchGame(versionId, modLoader);

        } catch (error) {
            Utils.showNotification(error.message, 'error');
            this.hideModal('progress-modal');
        } finally {
            const playBtn = document.getElementById('play-btn');
            playBtn.disabled = false;
            playBtn.innerHTML = '<i class="fas fa-play"></i> <span>PLAY</span>';
        }
    }

    // Switch screen
    switchScreen(screenName) {
        this.currentScreen = screenName;

        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.toggle('hidden', !screen.id.includes(screenName));
        });

        // Special handling for loading screen
        if (screenName !== 'loading') {
            document.getElementById('loading-screen').classList.add('hidden');
        }
    }

    // Update user info in UI
    updateUserInfo() {
        const user = window.authManager.getCurrentUser();
        const authType = window.authManager.getAccountStatus();

        if (user) {
            document.getElementById('current-username').textContent = user.username;
            document.getElementById('account-type').textContent = authType;
            document.getElementById('user-avatar').src = window.authManager.getUserAvatar();
        }
    }

    // Clear user info from UI
    clearUserInfo() {
        document.getElementById('current-username').textContent = 'Player';
        document.getElementById('account-type').textContent = 'Offline';
        document.getElementById('user-avatar').src = 'https://crafatar.com/avatars/steve';
    }

    // Show modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            this.modals.get(modalId).visible = true;
            
            // Focus first input if exists
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    // Hide modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            this.modals.get(modalId).visible = false;
        }
    }

    // Update progress modal
    updateProgressModal(progress) {
        document.getElementById('progress-fill').style.width = `${progress.progress}%`;
        document.getElementById('progress-percent').textContent = `${Math.round(progress.progress)}%`;
        document.getElementById('progress-size').textContent = 
            `${Utils.formatFileSize(progress.downloaded)} / ${Utils.formatFileSize(progress.total)}`;
        document.getElementById('progress-speed').textContent = Utils.formatSpeed(progress.speed);
        
        if (progress.eta && progress.eta !== Infinity) {
            document.getElementById('progress-file').textContent = 
                `ETA: ${Utils.formatDuration(progress.eta)}`;
        }
    }

    // Load versions content
    loadVersionsContent() {
        const versionsGrid = document.getElementById('versions-grid');
        const versions = window.versionManager.getAllVersions();

        versionsGrid.innerHTML = '';

        versions.forEach(version => {
            const versionCard = this.createVersionCard(version);
            versionsGrid.appendChild(versionCard);
        });
    }

    // Create version card
    createVersionCard(version) {
        const isInstalled = window.versionManager.isVersionInstalled(version.id);
        
        const card = document.createElement('div');
        card.className = `version-card ${isInstalled ? 'installed' : ''}`;
        card.innerHTML = `
            <div class="version-header">
                <span class="version-name">${version.id}</span>
                <span class="version-type ${version.type}">${version.type}</span>
            </div>
            <div class="version-info">
                Released: ${new Date(version.releaseTime).toLocaleDateString()}
            </div>
            <div class="version-actions">
                ${isInstalled ? 
                    '<button class="btn btn-success btn-sm"><i class="fas fa-check"></i> Installed</button>' :
                    '<button class="btn btn-primary btn-sm" onclick="window.uiManager.downloadVersion(\'' + version.id + '\')"><i class="fas fa-download"></i> Install</button>'
                }
                <button class="btn btn-secondary btn-sm" onclick="window.uiManager.showVersionDetails(\'' + version.id + '\')">
                    <i class="fas fa-info"></i> Details
                </button>
            </div>
        `;

        return card;
    }

    // Download version
    async downloadVersion(versionId) {
        try {
            this.showModal('progress-modal');
            document.getElementById('progress-title').textContent = `Downloading Minecraft ${versionId}`;

            await window.downloadManager.downloadVersion(versionId, null, (progress) => {
                this.updateProgressModal(progress);
            });

            this.hideModal('progress-modal');
            this.loadVersionsContent(); // Refresh versions list
            Utils.showNotification(`Minecraft ${versionId} installed successfully!`, 'success');

        } catch (error) {
            this.hideModal('progress-modal');
            Utils.showNotification(`Download failed: ${error.message}`, 'error');
        }
    }

    // Show version details
    showVersionDetails(versionId) {
        const version = window.versionManager.getVersionById(versionId);
        const changelog = window.versionManager.getVersionChangelog(versionId);
        
        // Create details modal (simplified)
        Utils.showNotification(`Version ${versionId} details would be shown here`, 'info');
    }

    // Filter versions
    filterVersions(filter) {
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // Filter versions
        const versions = window.versionManager.getVersionsByType(filter);
        const versionsGrid = document.getElementById('versions-grid');

        versionsGrid.innerHTML = '';
        versions.forEach(version => {
            const versionCard = this.createVersionCard(version);
            versionsGrid.appendChild(versionCard);
        });
    }

    // Load news content
    loadNewsContent() {
        const newsGrid = document.getElementById('news-grid');
        const mockNews = this.getMockNews();

        newsGrid.innerHTML = '';

        mockNews.forEach(article => {
            const newsCard = this.createNewsCard(article);
            newsGrid.appendChild(newsCard);
        });
    }

    // Get mock news
    getMockNews() {
        return [
            {
                title: 'Minecraft 1.21.1 Released',
                excerpt: 'The latest update brings bug fixes and performance improvements to the game.',
                image: 'https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg',
                date: '2024-08-08',
                url: '#'
            },
            {
                title: 'New Biome Coming Soon',
                excerpt: 'Explore the mysterious new biome with unique blocks and creatures.',
                image: 'https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg',
                date: '2024-07-25',
                url: '#'
            },
            {
                title: 'Community Spotlight',
                excerpt: 'Amazing builds from the Minecraft community that will inspire you.',
                image: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg',
                date: '2024-07-20',
                url: '#'
            }
        ];
    }

    // Create news card
    createNewsCard(article) {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
            <img src="${article.image}" alt="${article.title}" class="news-image">
            <div class="news-content">
                <h3 class="news-title">${article.title}</h3>
                <p class="news-excerpt">${article.excerpt}</p>
                <div class="news-meta">
                    <span>${new Date(article.date).toLocaleDateString()}</span>
                    <a href="${article.url}" class="btn btn-sm btn-primary">Read More</a>
                </div>
            </div>
        `;

        return card;
    }

    // Load servers content
    loadServersContent() {
        const serversList = document.getElementById('servers-list');
        const servers = this.getSavedServers();

        if (servers.length === 0) {
            serversList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-server"></i>
                    <p>No servers added</p>
                </div>
            `;
            return;
        }

        serversList.innerHTML = '';
        servers.forEach(server => {
            const serverCard = this.createServerCard(server);
            serversList.appendChild(serverCard);
        });
    }

    // Get saved servers
    getSavedServers() {
        return Utils.getLocalStorage('craftlauncher_servers', []);
    }

    // Create server card
    createServerCard(server) {
        const card = document.createElement('div');
        card.className = 'server-card';
        card.innerHTML = `
            <div class="server-icon">
                <i class="fas fa-server"></i>
            </div>
            <div class="server-info">
                <div class="server-name">${server.name}</div>
                <div class="server-address">${server.address}</div>
                <div class="server-status">
                    <span class="status-indicator ${server.online ? 'online' : 'offline'}"></span>
                    ${server.online ? `${server.players}/${server.maxPlayers} players` : 'Offline'}
                </div>
            </div>
            <div class="server-actions">
                <button class="btn btn-primary btn-sm" onclick="window.uiManager.joinServer('${server.address}')">
                    <i class="fas fa-play"></i> Join
                </button>
                <button class="btn btn-secondary btn-sm" onclick="window.uiManager.removeServer('${server.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        return card;
    }

    // Join server
    async joinServer(serverAddress) {
        const versionSelect = document.getElementById('version-select');
        const versionId = versionSelect.value;

        try {
            await window.gameLauncher.launchGame(versionId, null, serverAddress);
        } catch (error) {
            Utils.showNotification(`Failed to join server: ${error.message}`, 'error');
        }
    }

    // Load mods content
    loadModsContent() {
        const modsList = document.getElementById('installed-mods');
        modsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-puzzle-piece"></i>
                <p>No mods installed</p>
            </div>
        `;
    }

    // Load skins content
    loadSkinsContent() {
        const user = window.authManager.getCurrentUser();
        if (user) {
            document.getElementById('skin-preview').src = window.authManager.getUserSkin();
        }
    }

    // Setup settings inputs
    setupSettingsInputs() {
        // RAM allocation slider
        const ramSlider = document.getElementById('ram-allocation');
        const ramValue = document.querySelector('.range-value');
        
        if (ramSlider && ramValue) {
            ramSlider.addEventListener('input', (e) => {
                ramValue.textContent = `${e.target.value} MB`;
            });

            ramSlider.addEventListener('change', (e) => {
                window.gameLauncher.updateSettings({ ramAllocation: parseInt(e.target.value) });
            });
        }

        // Resolution inputs
        const widthInput = document.getElementById('resolution-width');
        const heightInput = document.getElementById('resolution-height');

        if (widthInput) {
            widthInput.addEventListener('change', (e) => {
                window.gameLauncher.updateSettings({ resolutionWidth: parseInt(e.target.value) });
            });
        }

        if (heightInput) {
            heightInput.addEventListener('change', (e) => {
                window.gameLauncher.updateSettings({ resolutionHeight: parseInt(e.target.value) });
            });
        }

        // JVM arguments
        const jvmArgs = document.getElementById('jvm-args');
        if (jvmArgs) {
            jvmArgs.addEventListener('change', (e) => {
                window.gameLauncher.updateSettings({ jvmArgs: e.target.value });
            });
        }

        // Checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const setting = {};
                setting[e.target.id] = e.target.checked;
                window.gameLauncher.updateSettings(setting);
            });
        });
    }

    // Handle window resize
    handleResize() {
        // Adjust UI for different screen sizes
        const isMobile = window.innerWidth < 768;
        document.body.classList.toggle('mobile', isMobile);
    }

    // Handle keyboard shortcuts
    handleKeyboard(e) {
        // Escape key closes modals
        if (e.key === 'Escape') {
            this.modals.forEach((modal, id) => {
                if (modal.visible) {
                    this.hideModal(id);
                }
            });
        }

        // Ctrl+Enter launches game
        if (e.ctrlKey && e.key === 'Enter' && this.currentScreen === 'main') {
            this.handlePlayGame();
        }
    }

    // Update statistics
    updateStatistics() {
        const downloadStats = window.downloadManager.getDownloadStats();
        const launchStats = window.gameLauncher.getLaunchStats();

        document.getElementById('download-count').textContent = downloadStats.totalFiles;
        document.getElementById('playtime').textContent = Utils.formatDuration(launchStats.totalPlaytime);
        document.getElementById('server-count').textContent = this.getSavedServers().length;
    }

    // Initialize launcher
    async initialize() {
        // Hide loading screen after initialization
        setTimeout(() => {
            // Check if user is already authenticated
            if (window.authManager.isAuthenticated()) {
                this.switchScreen('main');
                this.updateUserInfo();
            } else {
                this.switchScreen('login');
            }
            
            this.updateStatistics();
        }, 2000);
    }
}

// Export for use in other modules
window.UIManager = UIManager;