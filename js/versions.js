// Version Manager for CraftLauncher

class VersionManager {
    constructor() {
        this.versions = [];
        this.installedVersions = new Set();
        this.init();
    }

    init() {
        this.loadInstalledVersions();
        this.loadVersionManifest();
    }

    // Load installed versions from localStorage
    loadInstalledVersions() {
        const installed = Utils.getLocalStorage('craftlauncher_installed_versions', []);
        this.installedVersions = new Set(installed);
    }

    // Save installed versions to localStorage
    saveInstalledVersions() {
        Utils.setLocalStorage('craftlauncher_installed_versions', Array.from(this.installedVersions));
    }

    // Load Minecraft version manifest
    async loadVersionManifest() {
        try {
            // In a real implementation, this would fetch from Mojang's version manifest
            // For demo purposes, we'll use mock data
            this.versions = this.getMockVersions();
            return this.versions;
        } catch (error) {
            console.error('Failed to load version manifest:', error);
            Utils.showNotification('Failed to load Minecraft versions', 'error');
            return [];
        }
    }

    // Get mock version data
    getMockVersions() {
        return [
            {
                id: '1.21.1',
                type: 'release',
                url: 'https://piston-meta.mojang.com/v1/packages/1.21.1.json',
                time: '2024-08-08T11:22:58+00:00',
                releaseTime: '2024-08-08T11:10:48+00:00',
                sha1: 'abc123',
                complianceLevel: 1
            },
            {
                id: '1.21',
                type: 'release',
                url: 'https://piston-meta.mojang.com/v1/packages/1.21.json',
                time: '2024-06-13T08:24:05+00:00',
                releaseTime: '2024-06-13T08:24:05+00:00',
                sha1: 'def456',
                complianceLevel: 1
            },
            {
                id: '24w21b',
                type: 'snapshot',
                url: 'https://piston-meta.mojang.com/v1/packages/24w21b.json',
                time: '2024-05-24T12:15:32+00:00',
                releaseTime: '2024-05-24T12:15:32+00:00',
                sha1: 'ghi789',
                complianceLevel: 1
            },
            {
                id: '1.20.6',
                type: 'release',
                url: 'https://piston-meta.mojang.com/v1/packages/1.20.6.json',
                time: '2024-04-29T14:11:07+00:00',
                releaseTime: '2024-04-29T14:11:07+00:00',
                sha1: 'jkl012',
                complianceLevel: 1
            },
            {
                id: '1.20.4',
                type: 'release',
                url: 'https://piston-meta.mojang.com/v1/packages/1.20.4.json',
                time: '2023-12-07T12:56:18+00:00',
                releaseTime: '2023-12-07T12:56:18+00:00',
                sha1: 'mno345',
                complianceLevel: 1
            },
            {
                id: '1.19.4',
                type: 'release',
                url: 'https://piston-meta.mojang.com/v1/packages/1.19.4.json',
                time: '2023-03-14T12:56:18+00:00',
                releaseTime: '2023-03-14T12:56:18+00:00',
                sha1: 'pqr678',
                complianceLevel: 1
            },
            {
                id: '1.18.2',
                type: 'release',
                url: 'https://piston-meta.mojang.com/v1/packages/1.18.2.json',
                time: '2022-02-28T10:21:28+00:00',
                releaseTime: '2022-02-28T10:21:28+00:00',
                sha1: 'stu901',
                complianceLevel: 1
            },
            {
                id: '1.16.5',
                type: 'release',
                url: 'https://piston-meta.mojang.com/v1/packages/1.16.5.json',
                time: '2021-01-15T16:05:32+00:00',
                releaseTime: '2021-01-15T16:05:32+00:00',
                sha1: 'vwx234',
                complianceLevel: 0
            },
            {
                id: '1.12.2',
                type: 'release',
                url: 'https://piston-meta.mojang.com/v1/packages/1.12.2.json',
                time: '2017-09-18T08:39:46+00:00',
                releaseTime: '2017-09-18T08:39:46+00:00',
                sha1: 'yz0567',
                complianceLevel: 0
            },
            {
                id: '1.8.9',
                type: 'release',
                url: 'https://piston-meta.mojang.com/v1/packages/1.8.9.json',
                time: '2015-12-09T09:24:23+00:00',
                releaseTime: '2015-12-09T09:24:23+00:00',
                sha1: 'abc890',
                complianceLevel: 0
            }
        ];
    }

    // Get all versions
    getAllVersions() {
        return this.versions;
    }

    // Get versions by type
    getVersionsByType(type) {
        if (type === 'all') {
            return this.versions;
        }
        return this.versions.filter(version => version.type === type);
    }

    // Get version by ID
    getVersionById(id) {
        return this.versions.find(version => version.id === id);
    }

    // Check if version is installed
    isVersionInstalled(versionId) {
        return this.installedVersions.has(versionId);
    }

    // Mark version as installed
    markVersionInstalled(versionId) {
        this.installedVersions.add(versionId);
        this.saveInstalledVersions();
    }

    // Mark version as uninstalled
    markVersionUninstalled(versionId) {
        this.installedVersions.delete(versionId);
        this.saveInstalledVersions();
    }

    // Get installed versions
    getInstalledVersions() {
        return Array.from(this.installedVersions);
    }

    // Get version details
    async getVersionDetails(versionId) {
        const version = this.getVersionById(versionId);
        if (!version) {
            throw new Error(`Version ${versionId} not found`);
        }

        // In a real implementation, this would fetch the version JSON from the URL
        // For demo purposes, we'll return mock data
        return {
            id: version.id,
            type: version.type,
            mainClass: 'net.minecraft.client.main.Main',
            minecraftArguments: '--username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}',
            libraries: this.getMockLibraries(version.id),
            downloads: {
                client: {
                    sha1: version.sha1,
                    size: this.getVersionSize(version.id),
                    url: `https://piston-data.mojang.com/v1/objects/${version.sha1}/client.jar`
                }
            },
            assetIndex: {
                id: this.getAssetIndex(version.id),
                sha1: 'asset_' + version.sha1,
                size: 123456,
                totalSize: 234567890,
                url: `https://piston-meta.mojang.com/v1/packages/assets/${this.getAssetIndex(version.id)}.json`
            },
            javaVersion: {
                component: this.getJavaVersion(version.id),
                majorVersion: this.getJavaMajorVersion(version.id)
            }
        };
    }

    // Get mock libraries for a version
    getMockLibraries(versionId) {
        const baseLibraries = [
            'com.mojang:logging:1.0.0',
            'com.mojang:blocklist:1.0.10',
            'com.mojang:datafixerupper:6.0.8',
            'com.google.guava:guava:32.1.2-jre',
            'commons-io:commons-io:2.11.0',
            'commons-codec:commons-codec:1.15',
            'net.java.dev.jna:jna:5.12.1',
            'net.java.dev.jna:jna-platform:5.12.1',
            'org.lwjgl:lwjgl:3.3.1',
            'org.lwjgl:lwjgl-jemalloc:3.3.1',
            'org.lwjgl:lwjgl-openal:3.3.1',
            'org.lwjgl:lwjgl-opengl:3.3.1',
            'org.lwjgl:lwjgl-glfw:3.3.1',
            'org.lwjgl:lwjgl-stb:3.3.1'
        ];

        return baseLibraries.map(lib => ({
            name: lib,
            downloads: {
                artifact: {
                    path: lib.replace(/:/g, '/') + '.jar',
                    sha1: Utils.hashString(lib + versionId).toString(16),
                    size: Math.floor(Math.random() * 1000000) + 50000,
                    url: `https://libraries.minecraft.net/${lib.replace(/:/g, '/')}.jar`
                }
            }
        }));
    }

    // Get version file size (mock)
    getVersionSize(versionId) {
        const sizes = {
            '1.21.1': 25678901,
            '1.21': 25456789,
            '1.20.6': 24123456,
            '1.20.4': 23987654,
            '1.19.4': 22345678,
            '1.18.2': 21098765,
            '1.16.5': 18765432,
            '1.12.2': 15432109,
            '1.8.9': 12345678
        };
        return sizes[versionId] || 20000000;
    }

    // Get asset index for version
    getAssetIndex(versionId) {
        if (versionId.startsWith('1.21')) return '8';
        if (versionId.startsWith('1.20')) return '7';
        if (versionId.startsWith('1.19')) return '6';
        if (versionId.startsWith('1.18')) return '5';
        if (versionId.startsWith('1.16')) return '4';
        if (versionId.startsWith('1.12')) return '1.12';
        if (versionId.startsWith('1.8')) return '1.8';
        return 'legacy';
    }

    // Get Java version requirement
    getJavaVersion(versionId) {
        if (versionId.startsWith('1.21') || versionId.startsWith('1.20')) return 'java-runtime-delta';
        if (versionId.startsWith('1.19') || versionId.startsWith('1.18')) return 'java-runtime-beta';
        if (versionId.startsWith('1.17') || versionId.startsWith('1.16')) return 'java-runtime-alpha';
        return 'jre-legacy';
    }

    // Get Java major version
    getJavaMajorVersion(versionId) {
        if (versionId.startsWith('1.21') || versionId.startsWith('1.20')) return 21;
        if (versionId.startsWith('1.19') || versionId.startsWith('1.18') || versionId.startsWith('1.17')) return 17;
        if (versionId.startsWith('1.16')) return 8;
        return 8;
    }

    // Get mod loaders for version
    getModLoaders(versionId) {
        const modLoaders = [];
        
        // Forge availability
        if (!versionId.includes('w') && !versionId.includes('pre') && !versionId.includes('rc')) {
            modLoaders.push({
                name: 'Forge',
                id: 'forge',
                versions: this.getForgeVersions(versionId)
            });
        }

        // Fabric availability (most versions)
        modLoaders.push({
            name: 'Fabric',
            id: 'fabric',
            versions: this.getFabricVersions(versionId)
        });

        // OptiFine availability
        if (!versionId.includes('w') && !versionId.includes('pre')) {
            modLoaders.push({
                name: 'OptiFine',
                id: 'optifine',
                versions: this.getOptiFineVersions(versionId)
            });
        }

        return modLoaders;
    }

    // Get Forge versions (mock)
    getForgeVersions(versionId) {
        const forgeVersions = {
            '1.21.1': ['51.0.33', '51.0.32', '51.0.31'],
            '1.21': ['51.0.22', '51.0.21'],
            '1.20.6': ['50.1.0'],
            '1.20.4': ['49.1.0', '49.0.50'],
            '1.19.4': ['45.2.0', '45.1.0'],
            '1.18.2': ['40.2.0', '40.1.0'],
            '1.16.5': ['36.2.39', '36.2.35'],
            '1.12.2': ['14.23.5.2860', '14.23.5.2859'],
            '1.8.9': ['11.15.1.2318']
        };
        return forgeVersions[versionId] || [];
    }

    // Get Fabric versions (mock)
    getFabricVersions(versionId) {
        return ['0.15.11', '0.15.10', '0.15.9'];
    }

    // Get OptiFine versions (mock)
    getOptiFineVersions(versionId) {
        const optifineVersions = {
            '1.21.1': ['HD_U_I8', 'HD_U_I7'],
            '1.21': ['HD_U_I6'],
            '1.20.6': ['HD_U_I5'],
            '1.20.4': ['HD_U_I4', 'HD_U_I3'],
            '1.19.4': ['HD_U_I1'],
            '1.18.2': ['HD_U_H9', 'HD_U_H8'],
            '1.16.5': ['HD_U_G8', 'HD_U_G7'],
            '1.12.2': ['HD_U_F5'],
            '1.8.9': ['HD_U_M5']
        };
        return optifineVersions[versionId] || [];
    }

    // Calculate total download size for version
    async calculateDownloadSize(versionId, modLoader = null) {
        const versionDetails = await this.getVersionDetails(versionId);
        let totalSize = versionDetails.downloads.client.size;

        // Add libraries size
        versionDetails.libraries.forEach(lib => {
            if (lib.downloads && lib.downloads.artifact) {
                totalSize += lib.downloads.artifact.size;
            }
        });

        // Add assets size (estimated)
        totalSize += versionDetails.assetIndex.totalSize;

        // Add mod loader size if specified
        if (modLoader) {
            totalSize += this.getModLoaderSize(modLoader);
        }

        return totalSize;
    }

    // Get mod loader download size (mock)
    getModLoaderSize(modLoader) {
        const sizes = {
            forge: 15000000,    // ~15MB
            fabric: 5000000,    // ~5MB
            optifine: 8000000   // ~8MB
        };
        return sizes[modLoader] || 0;
    }

    // Get version changelog
    getVersionChangelog(versionId) {
        // Mock changelog data
        const changelogs = {
            '1.21.1': [
                'Fixed critical security vulnerability',
                'Improved performance in multiplayer',
                'Fixed various crashes'
            ],
            '1.21': [
                'Added new blocks and items',
                'New biome generation',
                'Updated mob AI',
                'Performance improvements'
            ],
            '1.20.6': [
                'Bug fixes and improvements',
                'Updated translations',
                'Fixed rendering issues'
            ]
        };
        return changelogs[versionId] || ['No changelog available'];
    }

    // Search versions
    searchVersions(query) {
        if (!query) return this.versions;
        
        const lowerQuery = query.toLowerCase();
        return this.versions.filter(version => 
            version.id.toLowerCase().includes(lowerQuery) ||
            version.type.toLowerCase().includes(lowerQuery)
        );
    }

    // Get latest version by type
    getLatestVersion(type = 'release') {
        const filteredVersions = this.getVersionsByType(type);
        return filteredVersions.length > 0 ? filteredVersions[0] : null;
    }

    // Get version statistics
    getVersionStats() {
        const stats = {
            total: this.versions.length,
            installed: this.installedVersions.size,
            releases: this.versions.filter(v => v.type === 'release').length,
            snapshots: this.versions.filter(v => v.type === 'snapshot').length,
            betas: this.versions.filter(v => v.type === 'beta').length,
            alphas: this.versions.filter(v => v.type === 'alpha').length
        };
        return stats;
    }
}

// Export for use in other modules
window.VersionManager = VersionManager;