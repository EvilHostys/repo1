// Main Application Entry Point for CraftLauncher

class CraftLauncher {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        this.managers = {};
    }

    // Initialize the application
    async init() {
        try {
            console.log('🚀 Initializing CraftLauncher v' + this.version);
            
            // Initialize managers in order
            await this.initializeManagers();
            
            // Setup global error handling
            this.setupErrorHandling();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            // Initialize UI
            await this.initializeUI();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('✅ CraftLauncher initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize CraftLauncher:', error);
            this.handleInitializationError(error);
        }
    }

    // Initialize all managers
    async initializeManagers() {
        console.log('📦 Initializing managers...');
        
        // Initialize managers in dependency order
        this.managers.auth = new AuthManager();
        this.managers.version = new VersionManager();
        this.managers.download = new DownloadManager();
        this.managers.launcher = new GameLauncher();
        this.managers.ui = new UIManager();
        
        // Make managers globally available
        window.authManager = this.managers.auth;
        window.versionManager = this.managers.version;
        window.downloadManager = this.managers.download;
        window.gameLauncher = this.managers.launcher;
        window.uiManager = this.managers.ui;
        
        console.log('✅ All managers initialized');
    }

    // Initialize UI
    async initializeUI() {
        console.log('🎨 Initializing UI...');
        
        // Initialize the UI manager
        await this.managers.ui.initialize();
        
        // Setup theme
        this.setupTheme();
        
        // Setup auto-updater
        this.setupAutoUpdater();
        
        console.log('✅ UI initialized');
    }

    // Setup error handling
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason);
        });
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    console.warn('High memory usage detected');
                    this.optimizeMemory();
                }
            }, 30000); // Check every 30 seconds
        }

        // Monitor frame rate
        let lastTime = performance.now();
        let frameCount = 0;
        
        const checkFrameRate = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                if (fps < 30) {
                    console.warn('Low frame rate detected:', fps, 'fps');
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(checkFrameRate);
        };
        
        requestAnimationFrame(checkFrameRate);
    }

    // Setup theme
    setupTheme() {
        const savedTheme = Utils.getLocalStorage('craftlauncher_theme', 'dark');
        this.setTheme(savedTheme);
        
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!Utils.getLocalStorage('craftlauncher_theme_manual')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    // Set theme
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        Utils.setLocalStorage('craftlauncher_theme', theme);
    }

    // Setup auto-updater
    setupAutoUpdater() {
        // Check for updates every hour
        setInterval(() => {
            this.checkForUpdates();
        }, 3600000);
        
        // Initial update check
        setTimeout(() => {
            this.checkForUpdates();
        }, 5000);
    }

    // Check for updates
    async checkForUpdates() {
        try {
            // In a real implementation, this would check for launcher updates
            console.log('🔍 Checking for updates...');
            
            // Mock update check
            const hasUpdate = Math.random() < 0.1; // 10% chance of update
            
            if (hasUpdate) {
                const updateAvailable = {
                    version: '1.0.1',
                    changelog: ['Bug fixes', 'Performance improvements', 'New features'],
                    downloadUrl: '#'
                };
                
                this.showUpdateNotification(updateAvailable);
            }
            
        } catch (error) {
            console.error('Failed to check for updates:', error);
        }
    }

    // Show update notification
    showUpdateNotification(update) {
        Utils.showNotification(
            `Update ${update.version} is available! Click to download.`,
            'info',
            10000
        );
    }

    // Handle errors
    handleError(error) {
        // Log error details
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('Error details:', errorInfo);
        
        // Show user-friendly error message
        if (this.initialized) {
            Utils.showNotification(
                'An error occurred. Please try again or restart the launcher.',
                'error'
            );
        }
        
        // In a real implementation, you might send error reports to a server
        this.reportError(errorInfo);
    }

    // Handle initialization errors
    handleInitializationError(error) {
        // Show critical error screen
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: var(--bg-primary);
                color: var(--text-primary);
                font-family: 'Inter', sans-serif;
                text-align: center;
                padding: 2rem;
            ">
                <div>
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--error-color); margin-bottom: 1rem;"></i>
                    <h1 style="margin-bottom: 1rem;">Failed to Initialize</h1>
                    <p style="margin-bottom: 2rem; color: var(--text-secondary);">
                        CraftLauncher encountered an error during startup.
                    </p>
                    <button onclick="location.reload()" style="
                        background: var(--primary-color);
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 0.5rem;
                        font-size: 1rem;
                        cursor: pointer;
                    ">
                        Retry
                    </button>
                </div>
            </div>
        `;
    }

    // Report error (mock implementation)
    reportError(errorInfo) {
        // In a real implementation, this would send the error to a logging service
        console.log('Error reported:', errorInfo);
    }

    // Optimize memory usage
    optimizeMemory() {
        console.log('🧹 Optimizing memory usage...');
        
        // Clear caches
        this.clearCaches();
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        Utils.showNotification('Memory optimized', 'info');
    }

    // Clear caches
    clearCaches() {
        // Clear version cache
        if (this.managers.version) {
            // Implementation would clear version cache
        }
        
        // Clear download cache
        if (this.managers.download) {
            this.managers.download.cleanupOldDownloads();
        }
        
        // Clear UI caches
        if (this.managers.ui) {
            // Implementation would clear UI caches
        }
    }

    // Get application info
    getAppInfo() {
        return {
            name: 'CraftLauncher',
            version: this.version,
            initialized: this.initialized,
            managers: Object.keys(this.managers),
            systemInfo: Utils.getSystemInfo(),
            performance: this.getPerformanceInfo()
        };
    }

    // Get performance info
    getPerformanceInfo() {
        const info = {
            timing: performance.timing,
            navigation: performance.navigation
        };
        
        if ('memory' in performance) {
            info.memory = performance.memory;
        }
        
        return info;
    }

    // Shutdown application
    async shutdown() {
        console.log('🔄 Shutting down CraftLauncher...');
        
        try {
            // Save current state
            await this.saveState();
            
            // Cleanup managers
            await this.cleanupManagers();
            
            // Clear intervals and timeouts
            this.clearTimers();
            
            console.log('✅ CraftLauncher shutdown complete');
            
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
        }
    }

    // Save application state
    async saveState() {
        // Save launcher settings
        if (this.managers.launcher) {
            // Settings are automatically saved by the launcher
        }
        
        // Save UI state
        if (this.managers.ui) {
            Utils.setLocalStorage('craftlauncher_ui_state', {
                currentScreen: this.managers.ui.currentScreen,
                currentSection: this.managers.ui.currentSection
            });
        }
    }

    // Cleanup managers
    async cleanupManagers() {
        // Cleanup download manager
        if (this.managers.download) {
            this.managers.download.cancelAllDownloads();
        }
        
        // Cleanup game launcher
        if (this.managers.launcher) {
            if (this.managers.launcher.isGameRunning()) {
                // Don't kill the game, just disconnect
                console.log('Game is running, keeping it alive');
            }
        }
    }

    // Clear timers
    clearTimers() {
        // Clear all intervals and timeouts
        const highestId = setTimeout(() => {}, 0);
        for (let i = 0; i < highestId; i++) {
            clearTimeout(i);
            clearInterval(i);
        }
    }

    // Restart application
    async restart() {
        await this.shutdown();
        location.reload();
    }

    // Export settings
    exportSettings() {
        const settings = {
            auth: Utils.getLocalStorage('craftlauncher_auth'),
            settings: Utils.getLocalStorage('craftlauncher_settings'),
            servers: Utils.getLocalStorage('craftlauncher_servers'),
            theme: Utils.getLocalStorage('craftlauncher_theme'),
            exportDate: new Date().toISOString(),
            version: this.version
        };
        
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        Utils.downloadFile(url, 'craftlauncher-backup.json');
        
        Utils.showNotification('Settings exported successfully', 'success');
    }

    // Import settings
    async importSettings(file) {
        try {
            const text = await file.text();
            const settings = JSON.parse(text);
            
            // Validate settings
            if (!settings.version || !settings.exportDate) {
                throw new Error('Invalid settings file');
            }
            
            // Import settings
            if (settings.auth) Utils.setLocalStorage('craftlauncher_auth', settings.auth);
            if (settings.settings) Utils.setLocalStorage('craftlauncher_settings', settings.settings);
            if (settings.servers) Utils.setLocalStorage('craftlauncher_servers', settings.servers);
            if (settings.theme) Utils.setLocalStorage('craftlauncher_theme', settings.theme);
            
            Utils.showNotification('Settings imported successfully. Restart required.', 'success');
            
            // Offer to restart
            setTimeout(() => {
                if (confirm('Restart CraftLauncher to apply imported settings?')) {
                    this.restart();
                }
            }, 2000);
            
        } catch (error) {
            Utils.showNotification('Failed to import settings: ' + error.message, 'error');
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Create global app instance
    window.craftLauncher = new CraftLauncher();
    
    // Initialize the application
    await window.craftLauncher.init();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.craftLauncher) {
        window.craftLauncher.shutdown();
    }
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, reduce activity
        console.log('🔇 Page hidden, reducing activity');
    } else {
        // Page is visible, resume normal activity
        console.log('🔊 Page visible, resuming activity');
        
        // Update UI if needed
        if (window.uiManager) {
            window.uiManager.updateStatistics();
        }
    }
});

// Export for debugging
window.CraftLauncher = CraftLauncher;