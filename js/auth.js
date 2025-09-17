// Authentication Manager for CraftLauncher

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authType = null;
        this.init();
    }

    init() {
        // Load saved authentication data
        this.loadSavedAuth();
    }

    // Load saved authentication from localStorage
    loadSavedAuth() {
        const savedAuth = Utils.getLocalStorage('craftlauncher_auth');
        if (savedAuth && savedAuth.user && savedAuth.type) {
            this.currentUser = savedAuth.user;
            this.authType = savedAuth.type;
            return true;
        }
        return false;
    }

    // Save authentication data
    saveAuth(user, type) {
        const authData = {
            user: user,
            type: type,
            timestamp: Date.now()
        };
        Utils.setLocalStorage('craftlauncher_auth', authData);
    }

    // Clear authentication data
    clearAuth() {
        this.currentUser = null;
        this.authType = null;
        Utils.removeLocalStorage('craftlauncher_auth');
    }

    // Offline authentication
    async authenticateOffline(username) {
        return new Promise((resolve, reject) => {
            // Validate username
            if (!Utils.isValidUsername(username)) {
                reject(new Error('Invalid username. Must be 3-16 characters, alphanumeric and underscores only.'));
                return;
            }

            // Create offline user object
            const user = {
                username: username,
                uuid: Utils.generateUUID(),
                accessToken: 'offline_' + Utils.generateUUID(),
                avatar: `https://crafatar.com/avatars/${username}?default=steve`,
                skin: `https://crafatar.com/skins/${username}?default=steve`
            };

            this.currentUser = user;
            this.authType = 'offline';
            this.saveAuth(user, 'offline');

            Utils.showNotification(`Welcome, ${username}!`, 'success');
            resolve(user);
        });
    }

    // Microsoft authentication (OAuth2)
    async authenticateMicrosoft() {
        return new Promise((resolve, reject) => {
            try {
                // In a real implementation, this would open Microsoft OAuth2 flow
                // For demo purposes, we'll simulate the process
                
                Utils.showNotification('Opening Microsoft authentication...', 'info');
                
                // Simulate OAuth2 flow
                setTimeout(() => {
                    // Mock Microsoft user data
                    const user = {
                        username: 'MinecraftPlayer',
                        uuid: '550e8400-e29b-41d4-a716-446655440000',
                        accessToken: 'microsoft_' + Utils.generateUUID(),
                        refreshToken: 'refresh_' + Utils.generateUUID(),
                        avatar: 'https://crafatar.com/avatars/550e8400-e29b-41d4-a716-446655440000',
                        skin: 'https://crafatar.com/skins/550e8400-e29b-41d4-a716-446655440000',
                        email: 'player@outlook.com'
                    };

                    this.currentUser = user;
                    this.authType = 'microsoft';
                    this.saveAuth(user, 'microsoft');

                    Utils.showNotification(`Welcome back, ${user.username}!`, 'success');
                    resolve(user);
                }, 2000);

            } catch (error) {
                Utils.showNotification('Microsoft authentication failed', 'error');
                reject(error);
            }
        });
    }

    // Mojang authentication (Legacy)
    async authenticateMojang(email, password) {
        return new Promise((resolve, reject) => {
            // Validate inputs
            if (!Utils.isValidEmail(email)) {
                reject(new Error('Invalid email address'));
                return;
            }

            if (!password || password.length < 6) {
                reject(new Error('Password must be at least 6 characters'));
                return;
            }

            // Simulate Mojang authentication
            Utils.showNotification('Authenticating with Mojang...', 'info');

            setTimeout(() => {
                try {
                    // Mock Mojang authentication response
                    const user = {
                        username: 'MojangPlayer',
                        uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5',
                        accessToken: 'mojang_' + Utils.generateUUID(),
                        avatar: 'https://crafatar.com/avatars/069a79f4-44e9-4726-a5be-fca90e38aaf5',
                        skin: 'https://crafatar.com/skins/069a79f4-44e9-4726-a5be-fca90e38aaf5',
                        email: email
                    };

                    this.currentUser = user;
                    this.authType = 'mojang';
                    this.saveAuth(user, 'mojang');

                    Utils.showNotification(`Welcome back, ${user.username}!`, 'success');
                    resolve(user);
                } catch (error) {
                    Utils.showNotification('Invalid credentials', 'error');
                    reject(new Error('Invalid email or password'));
                }
            }, 1500);
        });
    }

    // Refresh authentication token
    async refreshToken() {
        if (!this.currentUser || !this.authType) {
            throw new Error('No user authenticated');
        }

        switch (this.authType) {
            case 'microsoft':
                return this.refreshMicrosoftToken();
            case 'mojang':
                return this.refreshMojangToken();
            case 'offline':
                // Offline tokens don't need refreshing
                return this.currentUser;
            default:
                throw new Error('Unknown authentication type');
        }
    }

    // Refresh Microsoft token
    async refreshMicrosoftToken() {
        if (!this.currentUser.refreshToken) {
            throw new Error('No refresh token available');
        }

        // In a real implementation, this would call Microsoft's token refresh endpoint
        // For demo purposes, we'll simulate it
        return new Promise((resolve) => {
            setTimeout(() => {
                this.currentUser.accessToken = 'microsoft_' + Utils.generateUUID();
                this.saveAuth(this.currentUser, this.authType);
                resolve(this.currentUser);
            }, 1000);
        });
    }

    // Refresh Mojang token
    async refreshMojangToken() {
        // Mojang authentication doesn't support token refresh
        // User would need to re-authenticate
        throw new Error('Mojang tokens cannot be refreshed. Please re-authenticate.');
    }

    // Validate current token
    async validateToken() {
        if (!this.currentUser || !this.authType) {
            return false;
        }

        try {
            // Check if token is expired (simplified check)
            const authData = Utils.getLocalStorage('craftlauncher_auth');
            if (!authData || !authData.timestamp) {
                return false;
            }

            // Token expires after 24 hours for demo purposes
            const tokenAge = Date.now() - authData.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            if (tokenAge > maxAge && this.authType !== 'offline') {
                // Try to refresh token
                try {
                    await this.refreshToken();
                    return true;
                } catch (error) {
                    console.error('Token refresh failed:', error);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get authentication type
    getAuthType() {
        return this.authType;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null && this.authType !== null;
    }

    // Logout
    logout() {
        const username = this.currentUser ? this.currentUser.username : 'User';
        this.clearAuth();
        Utils.showNotification(`Goodbye, ${username}!`, 'info');
    }

    // Get user avatar URL
    getUserAvatar() {
        if (this.currentUser && this.currentUser.avatar) {
            return this.currentUser.avatar;
        }
        return 'https://crafatar.com/avatars/steve';
    }

    // Get user skin URL
    getUserSkin() {
        if (this.currentUser && this.currentUser.skin) {
            return this.currentUser.skin;
        }
        return 'https://crafatar.com/skins/steve';
    }

    // Update user profile
    async updateProfile(profileData) {
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        // Update local user data
        this.currentUser = { ...this.currentUser, ...profileData };
        this.saveAuth(this.currentUser, this.authType);

        Utils.showNotification('Profile updated successfully', 'success');
        return this.currentUser;
    }

    // Get account status
    getAccountStatus() {
        if (!this.isAuthenticated()) {
            return 'Not authenticated';
        }

        switch (this.authType) {
            case 'offline':
                return 'Offline Mode';
            case 'microsoft':
                return 'Microsoft Account';
            case 'mojang':
                return 'Mojang Account';
            default:
                return 'Unknown';
        }
    }

    // Check if account has premium features
    hasPremiumFeatures() {
        return this.authType === 'microsoft' || this.authType === 'mojang';
    }

    // Get user's Minecraft profile
    async getMinecraftProfile() {
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        // In a real implementation, this would fetch from Mojang/Microsoft APIs
        return {
            username: this.currentUser.username,
            uuid: this.currentUser.uuid,
            skin: this.getUserSkin(),
            cape: null, // Most users don't have capes
            model: 'steve' // or 'alex'
        };
    }
}

// Export for use in other modules
window.AuthManager = AuthManager;