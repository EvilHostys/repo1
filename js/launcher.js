// Game Launcher for CraftLauncher

class GameLauncher {
    constructor() {
        this.gameProcess = null;
        this.launchHistory = [];
        this.gameSettings = {
            ramAllocation: 2048,
            resolutionWidth: 1280,
            resolutionHeight: 720,
            jvmArgs: '-XX:+UseG1GC -XX:+UnlockExperimentalVMOptions',
            closeLauncherAfterStart: false
        };
        this.init();
    }

    init() {
        this.loadSettings();
        this.loadLaunchHistory();
    }

    // Load launcher settings
    loadSettings() {
        const savedSettings = Utils.getLocalStorage('craftlauncher_settings', {});
        this.gameSettings = { ...this.gameSettings, ...savedSettings };
    }

    // Save launcher settings
    saveSettings() {
        Utils.setLocalStorage('craftlauncher_settings', this.gameSettings);
    }

    // Update settings
    updateSettings(newSettings) {
        this.gameSettings = { ...this.gameSettings, ...newSettings };
        this.saveSettings();
        Utils.showNotification('Settings saved', 'success');
    }

    // Load launch history
    loadLaunchHistory() {
        this.launchHistory = Utils.getLocalStorage('craftlauncher_launch_history', []);
    }

    // Save launch history
    saveLaunchHistory() {
        Utils.setLocalStorage('craftlauncher_launch_history', this.launchHistory);
    }

    // Launch Minecraft
    async launchGame(versionId, modLoader = null, serverAddress = null) {
        const authManager = window.authManager;
        const versionManager = window.versionManager;

        try {
            // Verify user authentication
            if (!authManager.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            // Verify version is installed
            if (!versionManager.isVersionInstalled(versionId)) {
                throw new Error(`Minecraft ${versionId} is not installed`);
            }

            // Get user and version details
            const user = authManager.getCurrentUser();
            const versionDetails = await versionManager.getVersionDetails(versionId);

            // Prepare launch parameters
            const launchParams = await this.prepareLaunchParameters(user, versionDetails, modLoader, serverAddress);

            // Show launch notification
            Utils.showNotification(`Launching Minecraft ${versionId}...`, 'info');

            // Simulate game launch
            await this.simulateGameLaunch(launchParams);

            // Add to launch history
            this.addToLaunchHistory({
                versionId: versionId,
                modLoader: modLoader,
                serverAddress: serverAddress,
                timestamp: Date.now(),
                username: user.username
            });

            // Close launcher if setting is enabled
            if (this.gameSettings.closeLauncherAfterStart) {
                this.hideLauncher();
            }

            Utils.showNotification('Game launched successfully!', 'success');
            return true;

        } catch (error) {
            Utils.showNotification(`Launch failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // Prepare launch parameters
    async prepareLaunchParameters(user, versionDetails, modLoader, serverAddress) {
        const gameDirectory = this.getGameDirectory();
        const assetsDirectory = this.getAssetsDirectory();
        const librariesDirectory = this.getLibrariesDirectory();

        // Build classpath
        const classpath = this.buildClasspath(versionDetails, librariesDirectory);

        // Build JVM arguments
        const jvmArgs = this.buildJVMArguments();

        // Build game arguments
        const gameArgs = this.buildGameArguments(user, versionDetails, gameDirectory, assetsDirectory, serverAddress);

        return {
            mainClass: versionDetails.mainClass,
            classpath: classpath,
            jvmArgs: jvmArgs,
            gameArgs: gameArgs,
            workingDirectory: gameDirectory,
            versionId: versionDetails.id,
            user: user,
            modLoader: modLoader
        };
    }

    // Build classpath
    buildClasspath(versionDetails, librariesDirectory) {
        const classpath = [];

        // Add client jar
        classpath.push(`versions/${versionDetails.id}/${versionDetails.id}.jar`);

        // Add libraries
        versionDetails.libraries.forEach(library => {
            if (library.downloads && library.downloads.artifact) {
                classpath.push(`libraries/${library.downloads.artifact.path}`);
            }
        });

        return classpath.join(this.getPathSeparator());
    }

    // Build JVM arguments
    buildJVMArguments() {
        const jvmArgs = [];

        // Memory allocation
        jvmArgs.push(`-Xmx${this.gameSettings.ramAllocation}M`);
        jvmArgs.push(`-Xms${Math.min(512, this.gameSettings.ramAllocation)}M`);

        // Custom JVM arguments
        if (this.gameSettings.jvmArgs) {
            jvmArgs.push(...this.gameSettings.jvmArgs.split(' ').filter(arg => arg.trim()));
        }

        // System properties
        jvmArgs.push('-Djava.library.path=natives');
        jvmArgs.push('-Dminecraft.launcher.brand=CraftLauncher');
        jvmArgs.push('-Dminecraft.launcher.version=1.0.0');

        return jvmArgs;
    }

    // Build game arguments
    buildGameArguments(user, versionDetails, gameDirectory, assetsDirectory, serverAddress) {
        const gameArgs = [];

        // Parse Minecraft arguments
        if (versionDetails.minecraftArguments) {
            // Legacy format
            const args = versionDetails.minecraftArguments.split(' ');
            args.forEach(arg => {
                gameArgs.push(this.replaceArgumentVariables(arg, user, versionDetails, gameDirectory, assetsDirectory));
            });
        } else if (versionDetails.arguments && versionDetails.arguments.game) {
            // New format
            versionDetails.arguments.game.forEach(arg => {
                if (typeof arg === 'string') {
                    gameArgs.push(this.replaceArgumentVariables(arg, user, versionDetails, gameDirectory, assetsDirectory));
                }
            });
        }

        // Add resolution arguments
        gameArgs.push('--width', this.gameSettings.resolutionWidth.toString());
        gameArgs.push('--height', this.gameSettings.resolutionHeight.toString());

        // Add server arguments if specified
        if (serverAddress) {
            const [ip, port] = serverAddress.split(':');
            gameArgs.push('--server', ip);
            if (port) {
                gameArgs.push('--port', port);
            }
        }

        return gameArgs;
    }

    // Replace argument variables
    replaceArgumentVariables(arg, user, versionDetails, gameDirectory, assetsDirectory) {
        return arg
            .replace('${auth_player_name}', user.username)
            .replace('${version_name}', versionDetails.id)
            .replace('${game_directory}', gameDirectory)
            .replace('${assets_root}', assetsDirectory)
            .replace('${assets_index_name}', versionDetails.assetIndex.id)
            .replace('${auth_uuid}', user.uuid)
            .replace('${auth_access_token}', user.accessToken)
            .replace('${user_type}', this.getUserType(user))
            .replace('${version_type}', versionDetails.type)
            .replace('${launcher_name}', 'CraftLauncher')
            .replace('${launcher_version}', '1.0.0');
    }

    // Get user type
    getUserType(user) {
        const authManager = window.authManager;
        const authType = authManager.getAuthType();
        
        switch (authType) {
            case 'microsoft':
            case 'mojang':
                return 'mojang';
            case 'offline':
            default:
                return 'legacy';
        }
    }

    // Simulate game launch
    async simulateGameLaunch(launchParams) {
        return new Promise((resolve, reject) => {
            // Simulate launch process
            const launchSteps = [
                'Preparing game files...',
                'Loading libraries...',
                'Initializing game engine...',
                'Starting Minecraft...'
            ];

            let currentStep = 0;
            const stepInterval = setInterval(() => {
                if (currentStep < launchSteps.length) {
                    Utils.showNotification(launchSteps[currentStep], 'info', 1000);
                    currentStep++;
                } else {
                    clearInterval(stepInterval);
                    
                    // Simulate successful launch
                    this.gameProcess = {
                        pid: Math.floor(Math.random() * 10000) + 1000,
                        startTime: Date.now(),
                        version: launchParams.versionId,
                        user: launchParams.user.username
                    };
                    
                    resolve();
                }
            }, 800);

            // Simulate potential launch failure (5% chance)
            if (Math.random() < 0.05) {
                setTimeout(() => {
                    clearInterval(stepInterval);
                    reject(new Error('Failed to start game process'));
                }, Math.random() * 3000 + 1000);
            }
        });
    }

    // Get game directory
    getGameDirectory() {
        // In a real implementation, this would return the actual game directory
        return '.minecraft';
    }

    // Get assets directory
    getAssetsDirectory() {
        return '.minecraft/assets';
    }

    // Get libraries directory
    getLibrariesDirectory() {
        return '.minecraft/libraries';
    }

    // Get path separator
    getPathSeparator() {
        // In a real implementation, this would detect the OS
        return navigator.platform.toLowerCase().includes('win') ? ';' : ':';
    }

    // Hide launcher window
    hideLauncher() {
        // In a real implementation, this would minimize or hide the launcher window
        document.body.style.opacity = '0.5';
        Utils.showNotification('Launcher minimized', 'info');
    }

    // Show launcher window
    showLauncher() {
        document.body.style.opacity = '1';
    }

    // Check if game is running
    isGameRunning() {
        return this.gameProcess !== null;
    }

    // Get game process info
    getGameProcess() {
        return this.gameProcess;
    }

    // Kill game process
    killGame() {
        if (this.gameProcess) {
            Utils.showNotification('Game process terminated', 'info');
            this.gameProcess = null;
            this.showLauncher();
        }
    }

    // Add to launch history
    addToLaunchHistory(launchData) {
        this.launchHistory.unshift(launchData);
        
        // Keep only last 50 launches
        if (this.launchHistory.length > 50) {
            this.launchHistory.splice(50);
        }
        
        this.saveLaunchHistory();
    }

    // Get launch history
    getLaunchHistory() {
        return this.launchHistory;
    }

    // Get launch statistics
    getLaunchStats() {
        const stats = {
            totalLaunches: this.launchHistory.length,
            uniqueVersions: new Set(this.launchHistory.map(l => l.versionId)).size,
            favoriteVersion: this.getFavoriteVersion(),
            totalPlaytime: this.calculateTotalPlaytime(),
            lastLaunch: this.launchHistory.length > 0 ? this.launchHistory[0] : null
        };
        return stats;
    }

    // Get favorite version
    getFavoriteVersion() {
        if (this.launchHistory.length === 0) return null;
        
        const versionCounts = {};
        this.launchHistory.forEach(launch => {
            versionCounts[launch.versionId] = (versionCounts[launch.versionId] || 0) + 1;
        });
        
        return Object.keys(versionCounts).reduce((a, b) => 
            versionCounts[a] > versionCounts[b] ? a : b
        );
    }

    // Calculate total playtime (mock)
    calculateTotalPlaytime() {
        // In a real implementation, this would track actual playtime
        return this.launchHistory.length * 3600; // 1 hour per launch (mock)
    }

    // Validate Java installation
    async validateJavaInstallation(requiredVersion = 8) {
        // In a real implementation, this would check for Java installation
        // For demo purposes, we'll simulate validation
        return new Promise((resolve) => {
            setTimeout(() => {
                const hasJava = Math.random() > 0.1; // 90% chance of having Java
                const javaVersion = hasJava ? Math.max(requiredVersion, 8 + Math.floor(Math.random() * 13)) : 0;
                
                resolve({
                    installed: hasJava,
                    version: javaVersion,
                    path: hasJava ? '/usr/bin/java' : null,
                    compatible: javaVersion >= requiredVersion
                });
            }, 500);
        });
    }

    // Download and install Java
    async installJava(version = 17) {
        Utils.showNotification(`Downloading Java ${version}...`, 'info');
        
        // Simulate Java download and installation
        return new Promise((resolve) => {
            setTimeout(() => {
                Utils.showNotification(`Java ${version} installed successfully!`, 'success');
                resolve(true);
            }, 5000);
        });
    }

    // Create desktop shortcut
    createDesktopShortcut(versionId, modLoader = null) {
        // In a real implementation, this would create an actual desktop shortcut
        Utils.showNotification(`Desktop shortcut created for Minecraft ${versionId}`, 'success');
    }

    // Export game settings
    exportSettings() {
        const settings = {
            gameSettings: this.gameSettings,
            launchHistory: this.launchHistory,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        Utils.downloadFile(url, 'craftlauncher-settings.json');
        
        Utils.showNotification('Settings exported successfully', 'success');
    }

    // Import game settings
    async importSettings(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const settings = JSON.parse(e.target.result);
                    
                    if (settings.gameSettings) {
                        this.gameSettings = { ...this.gameSettings, ...settings.gameSettings };
                        this.saveSettings();
                    }
                    
                    if (settings.launchHistory) {
                        this.launchHistory = settings.launchHistory;
                        this.saveLaunchHistory();
                    }
                    
                    Utils.showNotification('Settings imported successfully', 'success');
                    resolve(settings);
                } catch (error) {
                    Utils.showNotification('Failed to import settings', 'error');
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                Utils.showNotification('Failed to read settings file', 'error');
                reject(new Error('File read error'));
            };
            
            reader.readAsText(file);
        });
    }

    // Get system requirements for version
    getSystemRequirements(versionId) {
        // Mock system requirements based on version
        const requirements = {
            '1.21.1': { ram: 4096, java: 21, storage: 4000 },
            '1.21': { ram: 4096, java: 21, storage: 4000 },
            '1.20.6': { ram: 2048, java: 17, storage: 3000 },
            '1.20.4': { ram: 2048, java: 17, storage: 3000 },
            '1.19.4': { ram: 2048, java: 17, storage: 2500 },
            '1.18.2': { ram: 2048, java: 17, storage: 2500 },
            '1.16.5': { ram: 1024, java: 8, storage: 2000 },
            '1.12.2': { ram: 1024, java: 8, storage: 1500 },
            '1.8.9': { ram: 512, java: 8, storage: 1000 }
        };
        
        return requirements[versionId] || { ram: 2048, java: 8, storage: 2000 };
    }

    // Check system compatibility
    async checkSystemCompatibility(versionId) {
        const requirements = this.getSystemRequirements(versionId);
        const systemInfo = Utils.getSystemInfo();
        
        // Mock compatibility check
        const compatibility = {
            ram: this.gameSettings.ramAllocation >= requirements.ram,
            java: await this.validateJavaInstallation(requirements.java),
            storage: true, // Assume sufficient storage for demo
            os: true // Assume compatible OS for demo
        };
        
        return {
            compatible: Object.values(compatibility).every(c => c === true || (typeof c === 'object' && c.compatible)),
            requirements: requirements,
            system: compatibility
        };
    }
}

// Export for use in other modules
window.GameLauncher = GameLauncher;