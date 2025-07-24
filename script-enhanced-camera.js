// Enhanced Camera Management for eKYC Application
class EnhancedCameraManager {
    constructor() {
        this.cameraStreams = {};
        this.currentFacingMode = {
            front: 'environment',
            back: 'environment',
            face: 'user'
        };
        this.cameraTimeouts = {};
    }

    // Enhanced camera initialization with proper error handling
    async initializeCamera(type, facingMode = null) {
        try {
            // Stop existing stream if any
            await this.cleanupCamera(type);

            const actualFacingMode = facingMode || this.currentFacingMode[type];
            
            const constraints = {
                video: {
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    facingMode: actualFacingMode,
                    focusMode: 'continuous',
                    frameRate: { ideal: 30, max: 60 }
                }
            };

            console.log(`Initializing camera for ${type} with facingMode: ${actualFacingMode}`);
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.cameraStreams[type] = stream;
            this.currentFacingMode[type] = actualFacingMode;

            // Optimize stream for performance
            this.optimizeCameraStream(stream);

            // Set up video element
            const video = document.getElementById(`${type}Video`);
            if (video) {
                video.srcObject = stream;
                
                // Wait for video to be ready
                await this.waitForVideoReady(video);
                
                // Add camera switch button if not exists
                this.addCameraSwitchButton(type);
            }

            return stream;
            
        } catch (error) {
            this.handleCameraError(error, type);
            throw error;
        }
    }

    // Wait for video to be ready
    async waitForVideoReady(video) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Camera timeout - video not ready'));
            }, 10000);

            if (video.videoWidth > 0 && video.videoHeight > 0) {
                clearTimeout(timeout);
                resolve();
            } else {
                video.onloadedmetadata = () => {
                    clearTimeout(timeout);
                    resolve();
                };
                
                video.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Video loading error'));
                };
            }
        });
    }

    // Switch between front and back cameras
    async switchCamera(type) {
        try {
            const currentMode = this.currentFacingMode[type];
            const newMode = currentMode === 'environment' ? 'user' : 'environment';
            
            console.log(`Switching camera for ${type} from ${currentMode} to ${newMode}`);
            
            await this.initializeCamera(type, newMode);
            
            // Update button state
            this.updateCameraSwitchButton(type, newMode);
            
        } catch (error) {
            console.error('Camera switch failed:', error);
            this.showError('Không thể chuyển camera. Vui lòng thử lại.');
        }
    }

    // Optimize camera stream for performance
    optimizeCameraStream(stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && videoTrack.applyConstraints) {
            const optimalConstraints = {
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 30, max: 30 }
            };
            
            videoTrack.applyConstraints(optimalConstraints).catch(error => {
                console.warn('Could not apply camera constraints:', error);
            });
        }
    }

    // Comprehensive error handling
    handleCameraError(error, type) {
        let userMessage = '';
        let technicalMessage = '';
        
        switch(error.name) {
            case 'NotFoundError':
                userMessage = 'Không tìm thấy camera. Vui lòng kiểm tra thiết bị của bạn.';
                technicalMessage = 'No camera found';
                break;
            case 'NotAllowedError':
                userMessage = 'Quyền truy cập camera bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.';
                technicalMessage = 'Camera permission denied';
                break;
            case 'NotReadableError':
                userMessage = 'Camera đang được sử dụng bởi ứng dụng khác.';
                technicalMessage = 'Camera in use by another application';
                break;
            case 'OverconstrainedError':
                userMessage = 'Camera không hỗ trợ độ phân giải yêu cầu.';
                technicalMessage = 'Camera constraints not supported';
                break;
            case 'AbortError':
                userMessage = 'Yêu cầu camera bị hủy.';
                technicalMessage = 'Camera request aborted';
                break;
            default:
                userMessage = `Lỗi camera: ${error.message || 'Không xác định'}`;
                technicalMessage = error.message || 'Unknown camera error';
        }
        
        console.error(`Camera error for ${type}:`, technicalMessage, error);
        this.showError(userMessage);
    }

    // Add camera switch button to UI
    addCameraSwitchButton(type) {
        const container = document.querySelector(`#${type}Video`).parentElement;
        let switchBtn = container.querySelector('.btn-switch-camera');
        
        if (!switchBtn) {
            switchBtn = document.createElement('button');
            switchBtn.className = 'btn-switch-camera';
            switchBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M16 16l4-4-4-4M8 8l-4 4 4 4m6-8l-4 4 4 4" stroke="currentColor" stroke-width="2"/>
                </svg>
            `;
            switchBtn.title = 'Chuyển camera';
            switchBtn.onclick = () => this.switchCamera(type);
            container.appendChild(switchBtn);
        }
        
        this.updateCameraSwitchButton(type);
    }

    // Update camera switch button based on current mode
    updateCameraSwitchButton(type) {
        const switchBtn = document.querySelector(`#${type}Video`).parentElement.querySelector('.btn-switch-camera');
        if (switchBtn) {
            const currentMode = this.currentFacingMode[type];
            switchBtn.title = currentMode === 'environment' ? 'Chuyển camera trước' : 'Chuyển camera sau';
        }
    }

    // Proper cleanup of camera streams
    async cleanupCamera(type) {
        if (this.cameraStreams[type]) {
            this.cameraStreams[type].getTracks().forEach(track => {
                track.stop();
            });
            this.cameraStreams[type] = null;
        }
        
        const video = document.getElementById(`${type}Video`);
        if (video) {
            video.srcObject = null;
        }
        
        // Remove switch button
        const container = document.querySelector(`#${type}Video`)?.parentElement;
        if (container) {
            const switchBtn = container.querySelector('.btn-switch-camera');
            if (switchBtn) {
                switchBtn.remove();
            }
        }
    }

    // Cleanup all cameras
    async cleanupAllCameras() {
        const types = ['front', 'back', 'face'];
        for (const type of types) {
            await this.cleanupCamera(type);
        }
    }

    // Validate camera availability
    async checkCameraAvailability() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            return {
                hasCamera: videoDevices.length > 0,
                hasFrontCamera: videoDevices.some(device => device.label?.includes('front') || device.facing === 'user'),
                hasBackCamera: videoDevices.some(device => device.label?.includes('back') || device.facing === 'environment'),
                devices: videoDevices
            };
        } catch (error) {
            console.error('Error checking camera availability:', error);
            return {
                hasCamera: false,
                hasFrontCamera: false,
                hasBackCamera: false,
                devices: []
            };
        }
    }

    // Show error message to user
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 8000);
        } else {
            alert(message);
        }
    }

    // Get camera info for debugging
    async getCameraInfo() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            return {
                count: videoDevices.length,
                devices: videoDevices.map((device, index) => ({
                    id: device.deviceId,
                    label: device.label || `Camera ${index + 1}`,
                    facing: this.getFacingMode(device.label)
                }))
            };
        } catch (error) {
            console.error('Error getting camera info:', error);
            return { count: 0, devices: [] };
        }
    }

    // Helper to determine facing mode from label
    getFacingMode(label) {
        if (!label) return 'unknown';
        
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes('front') || lowerLabel.includes('user')) return 'user';
        if (lowerLabel.includes('back') || lowerLabel.includes('rear') || lowerLabel.includes('environment')) return 'environment';
        
        return 'unknown';
    }

    // Enhanced capture with validation
    async captureImage(type) {
        try {
            const video = document.getElementById(`${type}Video`);
            const canvas = document.getElementById(`${type}Canvas`);
            
            if (!video || !canvas) {
                throw new Error('Video or canvas element not found');
            }

            // Validate video is ready
            await this.waitForVideoReady(video);

            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);

            return canvas.toDataURL('image/jpeg', 0.9);
            
        } catch (error) {
            console.error('Capture failed:', error);
            this.showError('Không thể chụp ảnh. Vui lòng thử lại.');
            throw error;
        }
    }
}

// Global camera manager instance
window.cameraManager = new EnhancedCameraManager();
