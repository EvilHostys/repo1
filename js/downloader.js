// Download Manager for CraftLauncher

class DownloadManager {
    constructor() {
        this.activeDownloads = new Map();
        this.downloadQueue = [];
        this.maxConcurrentDownloads = 3;
        this.downloadStats = {
            totalDownloaded: 0,
            totalFiles: 0,
            currentSpeed: 0,
            averageSpeed: 0
        };
        this.init();
    }

    init() {
        this.loadDownloadStats();
    }

    // Load download statistics
    loadDownloadStats() {
        const stats = Utils.getLocalStorage('craftlauncher_download_stats', {
            totalDownloaded: 0,
            totalFiles: 0
        });
        this.downloadStats = { ...this.downloadStats, ...stats };
    }

    // Save download statistics
    saveDownloadStats() {
        Utils.setLocalStorage('craftlauncher_download_stats', {
            totalDownloaded: this.downloadStats.totalDownloaded,
            totalFiles: this.downloadStats.totalFiles
        });
    }

    // Download a single file
    async downloadFile(url, filename, options = {}) {
        const downloadId = Utils.generateUUID();
        
        const download = {
            id: downloadId,
            url: url,
            filename: filename,
            progress: 0,
            speed: 0,
            startTime: Date.now(),
            size: 0,
            downloaded: 0,
            status: 'pending',
            ...options
        };

        this.activeDownloads.set(downloadId, download);

        try {
            // Simulate file download
            await this.simulateDownload(download);
            
            download.status = 'completed';
            this.downloadStats.totalFiles++;
            this.downloadStats.totalDownloaded += download.size;
            this.saveDownloadStats();

            return download;
        } catch (error) {
            download.status = 'failed';
            download.error = error.message;
            throw error;
        } finally {
            this.activeDownloads.delete(downloadId);
        }
    }

    // Simulate file download with progress
    async simulateDownload(download) {
        return new Promise((resolve, reject) => {
            // Mock file size
            download.size = Math.floor(Math.random() * 50000000) + 1000000; // 1-50MB
            
            const chunkSize = Math.floor(download.size / 100); // 1% chunks
            let downloaded = 0;
            
            download.status = 'downloading';
            
            const downloadInterval = setInterval(() => {
                // Simulate variable download speed
                const speedVariation = 0.5 + Math.random(); // 0.5x to 1.5x speed
                const chunkDownloaded = Math.min(chunkSize * speedVariation, download.size - downloaded);
                
                downloaded += chunkDownloaded;
                download.downloaded = downloaded;
                download.progress = (downloaded / download.size) * 100;
                
                // Calculate speed
                const elapsed = (Date.now() - download.startTime) / 1000;
                download.speed = downloaded / elapsed;
                
                // Update progress callback if provided
                if (download.onProgress) {
                    download.onProgress(download);
                }
                
                // Check if download is complete
                if (downloaded >= download.size) {
                    clearInterval(downloadInterval);
                    download.progress = 100;
                    resolve(download);
                }
            }, 50 + Math.random() * 100); // Variable interval for realism
            
            // Simulate potential download failure (5% chance)
            if (Math.random() < 0.05) {
                setTimeout(() => {
                    clearInterval(downloadInterval);
                    reject(new Error('Download failed: Network error'));
                }, Math.random() * 3000 + 1000);
            }
        });
    }

    // Download Minecraft version
    async downloadVersion(versionId, modLoader = null, onProgress = null) {
        const versionManager = window.versionManager;
        const versionDetails = await versionManager.getVersionDetails(versionId);
        
        const downloadTasks = [];
        let totalSize = 0;
        let downloadedSize = 0;

        // Calculate total download size
        totalSize += versionDetails.downloads.client.size;
        versionDetails.libraries.forEach(lib => {
            if (lib.downloads && lib.downloads.artifact) {
                totalSize += lib.downloads.artifact.size;
            }
        });
        totalSize += versionDetails.assetIndex.totalSize;

        if (modLoader) {
            totalSize += versionManager.getModLoaderSize(modLoader);
        }

        // Progress tracking
        const updateProgress = () => {
            const progress = (downloadedSize / totalSize) * 100;
            if (onProgress) {
                onProgress({
                    progress: progress,
                    downloaded: downloadedSize,
                    total: totalSize,
                    speed: this.calculateAverageSpeed(),
                    eta: this.calculateETA(downloadedSize, totalSize)
                });
            }
        };

        try {
            // Download client jar
            Utils.showNotification(`Downloading Minecraft ${versionId}...`, 'info');
            
            const clientDownload = await this.downloadFile(
                versionDetails.downloads.client.url,
                `${versionId}.jar`,
                {
                    onProgress: (download) => {
                        downloadedSize = download.downloaded;
                        updateProgress();
                    }
                }
            );
            downloadedSize = versionDetails.downloads.client.size;
            updateProgress();

            // Download libraries
            Utils.showNotification('Downloading libraries...', 'info');
            
            for (const library of versionDetails.libraries) {
                if (library.downloads && library.downloads.artifact) {
                    await this.downloadFile(
                        library.downloads.artifact.url,
                        library.downloads.artifact.path,
                        {
                            onProgress: (download) => {
                                downloadedSize += download.downloaded - (download.previousDownloaded || 0);
                                download.previousDownloaded = download.downloaded;
                                updateProgress();
                            }
                        }
                    );
                    downloadedSize += library.downloads.artifact.size;
                    updateProgress();
                }
            }

            // Download assets
            Utils.showNotification('Downloading game assets...', 'info');
            await this.downloadAssets(versionDetails.assetIndex, (progress) => {
                downloadedSize += progress;
                updateProgress();
            });

            // Download mod loader if specified
            if (modLoader) {
                Utils.showNotification(`Downloading ${modLoader}...`, 'info');
                await this.downloadModLoader(versionId, modLoader, (progress) => {
                    downloadedSize += progress;
                    updateProgress();
                });
            }

            // Mark version as installed
            versionManager.markVersionInstalled(versionId);
            
            Utils.showNotification(`Minecraft ${versionId} downloaded successfully!`, 'success');
            return true;

        } catch (error) {
            Utils.showNotification(`Download failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // Download game assets
    async downloadAssets(assetIndex, onProgress = null) {
        // Simulate asset download
        return new Promise((resolve) => {
            let downloaded = 0;
            const totalSize = assetIndex.totalSize;
            
            const assetInterval = setInterval(() => {
                const chunkSize = Math.floor(totalSize / 200); // Smaller chunks for assets
                downloaded += chunkSize;
                
                if (onProgress) {
                    onProgress(chunkSize);
                }
                
                if (downloaded >= totalSize) {
                    clearInterval(assetInterval);
                    resolve();
                }
            }, 25);
        });
    }

    // Download mod loader
    async downloadModLoader(versionId, modLoader, onProgress = null) {
        const versionManager = window.versionManager;
        const modLoaderSize = versionManager.getModLoaderSize(modLoader);
        
        return new Promise((resolve) => {
            let downloaded = 0;
            
            const modLoaderInterval = setInterval(() => {
                const chunkSize = Math.floor(modLoaderSize / 50);
                downloaded += chunkSize;
                
                if (onProgress) {
                    onProgress(chunkSize);
                }
                
                if (downloaded >= modLoaderSize) {
                    clearInterval(modLoaderInterval);
                    resolve();
                }
            }, 100);
        });
    }

    // Calculate average download speed
    calculateAverageSpeed() {
        const activeDownloads = Array.from(this.activeDownloads.values());
        if (activeDownloads.length === 0) return 0;
        
        const totalSpeed = activeDownloads.reduce((sum, download) => sum + download.speed, 0);
        return totalSpeed / activeDownloads.length;
    }

    // Calculate estimated time remaining
    calculateETA(downloaded, total) {
        const remaining = total - downloaded;
        const speed = this.calculateAverageSpeed();
        
        if (speed === 0) return Infinity;
        return remaining / speed;
    }

    // Get download progress for version
    getVersionDownloadProgress(versionId) {
        const downloads = Array.from(this.activeDownloads.values());
        const versionDownloads = downloads.filter(d => d.filename.includes(versionId));
        
        if (versionDownloads.length === 0) return null;
        
        const totalProgress = versionDownloads.reduce((sum, d) => sum + d.progress, 0);
        return totalProgress / versionDownloads.length;
    }

    // Cancel download
    cancelDownload(downloadId) {
        const download = this.activeDownloads.get(downloadId);
        if (download) {
            download.status = 'cancelled';
            this.activeDownloads.delete(downloadId);
            Utils.showNotification('Download cancelled', 'info');
        }
    }

    // Cancel all downloads
    cancelAllDownloads() {
        this.activeDownloads.forEach((download, id) => {
            download.status = 'cancelled';
        });
        this.activeDownloads.clear();
        Utils.showNotification('All downloads cancelled', 'info');
    }

    // Get active downloads
    getActiveDownloads() {
        return Array.from(this.activeDownloads.values());
    }

    // Get download statistics
    getDownloadStats() {
        return {
            ...this.downloadStats,
            activeDownloads: this.activeDownloads.size,
            currentSpeed: this.calculateAverageSpeed()
        };
    }

    // Verify file integrity
    async verifyFile(filename, expectedSha1) {
        // In a real implementation, this would calculate the SHA1 hash of the downloaded file
        // For demo purposes, we'll simulate verification
        return new Promise((resolve) => {
            setTimeout(() => {
                // 95% success rate for demo
                const isValid = Math.random() > 0.05;
                resolve(isValid);
            }, 500);
        });
    }

    // Repair corrupted files
    async repairFiles(versionId) {
        Utils.showNotification('Verifying and repairing files...', 'info');
        
        // Simulate file verification and repair
        return new Promise((resolve) => {
            setTimeout(() => {
                const corruptedFiles = Math.floor(Math.random() * 3); // 0-2 corrupted files
                
                if (corruptedFiles > 0) {
                    Utils.showNotification(`Repaired ${corruptedFiles} corrupted files`, 'success');
                } else {
                    Utils.showNotification('All files are valid', 'success');
                }
                
                resolve(corruptedFiles);
            }, 2000);
        });
    }

    // Clean up old downloads
    cleanupOldDownloads() {
        // Remove downloads older than 24 hours
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
        
        this.activeDownloads.forEach((download, id) => {
            if (download.startTime < cutoffTime) {
                this.activeDownloads.delete(id);
            }
        });
    }

    // Get download history
    getDownloadHistory() {
        return Utils.getLocalStorage('craftlauncher_download_history', []);
    }

    // Add to download history
    addToHistory(download) {
        const history = this.getDownloadHistory();
        history.unshift({
            filename: download.filename,
            size: download.size,
            date: new Date().toISOString(),
            status: download.status
        });
        
        // Keep only last 50 downloads
        if (history.length > 50) {
            history.splice(50);
        }
        
        Utils.setLocalStorage('craftlauncher_download_history', history);
    }

    // Estimate download time
    estimateDownloadTime(size, speed = null) {
        const downloadSpeed = speed || this.downloadStats.averageSpeed || 1000000; // 1MB/s default
        return size / downloadSpeed;
    }

    // Check available disk space (mock)
    async checkDiskSpace() {
        // In a real implementation, this would check actual disk space
        // For demo purposes, we'll return a mock value
        return {
            available: 50 * 1024 * 1024 * 1024, // 50GB
            total: 500 * 1024 * 1024 * 1024     // 500GB
        };
    }

    // Pause download
    pauseDownload(downloadId) {
        const download = this.activeDownloads.get(downloadId);
        if (download && download.status === 'downloading') {
            download.status = 'paused';
            Utils.showNotification('Download paused', 'info');
        }
    }

    // Resume download
    resumeDownload(downloadId) {
        const download = this.activeDownloads.get(downloadId);
        if (download && download.status === 'paused') {
            download.status = 'downloading';
            Utils.showNotification('Download resumed', 'info');
        }
    }
}

// Export for use in other modules
window.DownloadManager = DownloadManager;