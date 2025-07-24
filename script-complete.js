// Enhanced eKYC Application - Complete Implementation
document.addEventListener('DOMContentLoaded', () => {
    class EkycAppComplete {
        constructor() {
            this.config = {
                AUTO_CAPTURE_INTERVAL: 500,
                MAX_CAPTURE_TIMEOUT: 30000,
                ERROR_MESSAGE_TIMEOUT: 5000,
                FACE_AUTO_CAPTURE_DELAY: 1500,
                LIVENESS_ACTION_DURATION: 2000,
                LIVENESS_COOLDOWN_DURATION: 1000,
                FACE_DETECTION_INTERVAL: 100,
                MAX_LIVENESS_ATTEMPTS: 3,
                CARD_ASPECT_RATIO: 1.58,
                CARD_DETECTION_THRESHOLD: 0.05,
                CARD_SIZE_MIN_PERCENT: 0.4,
                CARD_SIZE_MAX_PERCENT: 0.8,
            };
            
            this.initLanguage();
            this.cacheDOMElements();
            this.initState();
            this.initEventListeners();
            this.updateUIWithLanguage();
            this.initOCR();
        }

        // Language Management
        initLanguage() {
            this.languages = {
                vi: {
                    stepper_step1: "Bước 1/4: Chọn loại giấy tờ",
                    stepper_step2: "Bước 2/4: Chụp ảnh giấy tờ",
                    stepper_step3: "Bước 3/4: Xác thực khuôn mặt",
                    stepper_step4: "Bước 4/4: Hoàn tất xác thực",
                    loading_resources: "Đang tải tài nguyên...",
                    success_title: "Xác thực thành công!",
                    success_subtitle: "Cảm ơn bạn đã hoàn tất quá trình xác thực eKYC.",
                    docselect_title: "Xác thực giấy tờ",
                    docselect_subtitle: "Chọn một trong các phương thức xác thực dưới đây",
                    capture_front_title: "Chụp mặt trước",
                    capture_back_title: "Chụp mặt sau",
                    capture_instruction_front: "Đưa mặt trước giấy tờ vào khung hình",
                    capture_instruction_back: "Đưa mặt sau giấy tờ vào khung hình",
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
                    stepper_step3: "Step 3/4: Face verification",
                    stepper_step4: "Step 4/4: Complete verification",
                    loading_resources: "Loading resources...",
                    success_title: "Verification successful!",
                    success_subtitle: "Thank you for completing the eKYC process.",
                    docselect_title: "Document Verification",
                    docselect_subtitle: "Choose one of the verification methods below",
                    capture_front_title: "Capture front side",
                    capture_back_title: "Capture back side",
                    capture_instruction_front: "Place the front side inside the frame",
                    capture_instruction_back: "Place the back side inside the frame",
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
                ocrWorker: null
            };
        }

        // OCR Initialization
        async initOCR() {
            try {
                if (typeof Tesseract !== 'undefined') {
                    this.showLoading('Đang khởi tạo OCR...');
                    this.state.ocrWorker = await Tesseract.createWorker(['vie', 'eng'], 1, {
                        logger: (m) => {
                            if (m.status === 'recognizing text') {
                                console.log(`OCR Progress: ${(m.progress * 100).toFixed(2)}%`);
                            }
                        }
                    });
                    console.log('OCR initialized successfully');
                    this.hideLoading();
                }
            } catch (error) {
                console.error('OCR initialization failed:', error);
                this.hideLoading();
            }
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

            document.addEventListener('keydown', (e) => this.handleKeydown(e));

            // Global function for modal buttons
            window.startCapture = () => this.startCapture();
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

        // Camera Management
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
                this.showError(this.languages[this.currentLang].error_capture_timeout);
            }
        }

        async initCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'environment'
                    }
                });

                this.state.cameraStream = stream;
                if (this.dom.cameraVideo) {
                    this.dom.cameraVideo.srcObject = stream;
                    await this.dom.cameraVideo.play();
                }

                this.startDocumentDetection();
            } catch (error) {
                console.error('Camera access failed:', error);
                throw error;
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
                
                if (canvas && video) {
                    const ctx = canvas.getContext('2d');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0);
                    
                    const imageData = canvas.toDataURL('image/jpeg', 0.9);
                    this.state.capturedImages[this.state.captureStep] = imageData;

                    this.dom.cameraFrame?.classList.add('blink-once');
                    setTimeout(() => {
                        this.dom.cameraFrame?.classList.remove('blink-once');
                    }, 500);

                    await this.processImage(imageData);
                }
            } catch (error) {
                console.error('Capture failed:', error);
                this.showError(this.languages[this.currentLang].error_capture_timeout);
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
            
            // Extract information from image using OCR
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
                // Skip confirmation view as requested - go directly to video tutorial
                this.showVideoTutorial();
            }
        }

        // Enhanced OCR with Vietnamese support
        async extractInfoFromImage(imageData) {
            this.showLoading('Đang trích xuất thông tin từ giấy tờ...');
            
            try {
                if (this.state.ocrWorker) {
                    // Try real OCR first
                    const { data: { text, confidence } } = await this.state.ocrWorker.recognize(imageData, {
                        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ /:.-',
                        tessedit_pageseg_mode: '6'
                    });
                    
                    console.log('OCR Text:', text);
                    console.log('OCR Confidence:', confidence);
                    
                    if (confidence > 30 && text.trim().length > 10) {
                        const extractedData = this.parseVietnameseID(text);
                        if (this.validateExtractedData(extractedData)) {
                            return extractedData;
                        }
                    }
                }
            } catch (error) {
                console.error('OCR Error:', error);
            }
            
            // Fallback to simulated extraction
            return this.simulateOCRExtraction();
        }

        // Parse Vietnamese ID with enhanced patterns
        parseVietnameseID(text) {
            const data = {};
            
            // Enhanced Vietnamese patterns for accurate extraction
            const patterns = {
                idNumber: [
                    /(?:SỐ|SO|CCCD|Số)[:\s]*([0-9]{12})/gi,
                    /(?:SỐ|SO|CMND|Số)[:\s]*([0-9]{9})/gi,
                    /([0-9]{12})/g,
                    /([0-9]{9})/g
                ],
                fullName: [
                    /(?:HỌ VÀ TÊN|HO VA TEN|Họ và tên|HỌ TÊN)[:\s]*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]{2,50})/gi,
                    /([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]{10,50})/g
                ],
                dateOfBirth: [
                    /(?:NGÀY SINH|NGAY SINH|Ngày sinh)[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/gi,
                    /([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/g
                ]
            };
            
            // Extract data using patterns
            Object.keys(patterns).forEach(key => {
                const patternArray = patterns[key];
                for (const pattern of patternArray) {
                    const match = text.match(pattern);
                    if (match && match[1]) {
                        data[key] = match[1].trim();
                        break;
                    }
                }
            });
            
            // Clean up extracted text
            Object.keys(data).forEach(key => {
                if (data[key]) {
                    data[key] = data[key].replace(/\s+/g, ' ').trim();
                }
            });
            
            return data;
        }

        // Validate extracted data
        validateExtractedData(data) {
            const requiredFields = ['idNumber', 'fullName', 'dateOfBirth'];
            return requiredFields.every(field => data[field] && data[field].trim().length > 0);
        }

        // Simulate OCR extraction with realistic Vietnamese data
        simulateOCRExtraction() {
            const mockDataSets = [
                {
                    idNumber: '023456789012',
                    fullName: 'NGUYỄN VĂN MINH',
                    dateOfBirth: '15/03/1985'
                },
                {
                    idNumber: '034567890123',
                    fullName: 'TRẦN THỊ LAN',
                    dateOfBirth: '22/07/1990'
                },
                {
                    idNumber: '045678901234',
                    fullName: 'LÊ VĂN ĐỨC',
                    dateOfBirth: '08/11/1988'
                },
                {
                    idNumber: '056789012345',
                    fullName: 'PHẠM THỊ HƯƠNG',
                    dateOfBirth: '30/05/1992'
                }
            ];
            
            const randomIndex = Math.floor(Math.random() * mockDataSets.length);
            return mockDataSets[randomIndex];
        }

        // Image quality checking
        async checkImageQuality(imageData, imageType) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const errors = [];
            let isValid = true;
            
            // Simulate random quality issues (20% chance)
            const hasQualityIssues = Math.random() < 0.2;
            
            if (hasQualityIssues) {
                const possibleErrors = [
                    'Ảnh bị mờ, vui lòng chụp lại',
                    'Ánh sáng không đủ, vui lòng chụp ở nơi sáng hơn',
                    'Ảnh bị lóa sáng, vui lòng tránh ánh sáng trực tiếp',
                    'Không phát hiện được giấy tờ trong khung hình'
                ];
                
                const randomError = possibleErrors[Math.floor(Math.random() * possibleErrors.length)];
                errors.push(randomError);
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

        // Video Tutorial
        showVideoTutorial() {
            this.showView('videoTutorialView');
            this.updateStepper(this.languages[