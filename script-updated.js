// Complete eKYC Application with Enhanced Camera Functionality
document.addEventListener('DOMContentLoaded', () => {
    class EkycAppUpdated {
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
                OCR_CONFIDENCE_THRESHOLD: 20,
                CAMERA_TIMEOUT: 10000,
            };
            
            this.cameraManager = new EnhancedCameraManager();
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
                ocrWorker: null,
                crossValidationData: {}
            };
        }

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

        updateUIWithLanguage() {
            document.querySelectorAll('[data-lang-key]').forEach(el => {
                const key = el.getAttribute('data-lang-key');
                if (this.languages[this.currentLang][key]) {
                    el.textContent = this.languages[this.currentLang][key];
                }
            });
            this.updateStepper(this.languages[this.currentLang].stepper_step1);
        }

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

        async startCapture() {
            this.showView('captureView');
            this.state.captureStep = 'front';
            this.updateCaptureUI();
            this.updateStepper(this.languages[this.currentLang].stepper_step2);
            this.updateProgressBar(2);

            try {
                await this.cameraManager.initializeCamera('front');
                this.showCameraSwitchIfSupported('front');
            } catch (error) {
                this.showError(this.languages[this.currentLang].error_capture_timeout);
            }
        }

        showCameraSwitchIfSupported(type) {
            this.cameraManager.checkCameraAvailability().then(info => {
                const btnSwitch = document.getElementById('btnSwitchCamera');
                if (btnSwitch && info.hasFrontCamera && info.hasBackCamera) {
                    btnSwitch.style.display = 'flex';
                    btnSwitch.onclick = () => this.cameraManager.switchCamera(type);
                } else if (btnSwitch) {
                    btnSwitch.style.display = 'none';
                }
            });
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

                if (video.videoWidth === 0 || video.videoHeight === 0) {
                    throw new Error('Camera chưa sẵn sàng. Vui lòng đợi camera khởi tạo.');
                }

                const ctx = canvas.getContext('2d');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = canvas.toDataURL('image/jpeg', 0.95);

                if (!imageData || imageData === 'data:,') {
                    throw new Error('Không thể chụp ảnh. Vui lòng thử lại.');
                }

                this.state.capturedImages[this.state.captureStep] = imageData;

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

            const qualityCheck = await this.checkImageQuality(imageData, this.state.captureStep);

            if (!qualityCheck.isValid) {
                this.hideLoading();
                this.showImageErrors(qualityCheck.errors);
                return;
            }

            this.state.imageQualityChecks[this.state.captureStep] = qualityCheck;

            await new Promise(resolve => setTimeout(resolve, 1500));

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

        async extractInfoFromImage(imageData) {
            this.showLoading('Đang trích xuất thông tin từ giấy tờ...');
            try {
                if (!this.state.ocrWorker) {
                    await this.initOCRWorker();
                }

                if (this.state.ocrWorker) {
                    const processedImage = await this.preprocessImageForOCR(imageData);

                    const ocrOptions = {
                        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ /:.-',
                        tessedit_pageseg_mode: '6'
                    };

                    const { data: { text, confidence } } = await this.state.ocrWorker.recognize(processedImage, ocrOptions);
                    console.log('OCR Text:', text);
                    console.log('OCR Confidence:', confidence);

                    if (confidence > this.config.OCR_CONFIDENCE_THRESHOLD && text.trim().length > 10) {
                        const extractedData = this.parseVietnameseID(text);
                        const validation = this.validateExtractedData(extractedData);

                        if (validation.isValid) {
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
            return await this.showManualInputModal();
        }

        async preprocessImageForOCR(imageData) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    for (let i = 0; i < data.length; i += 4) {
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

        parseVietnameseID(text) {
            const data = {};

            const patterns = {
                cccd: {
                    idNumber: [
                        /(?:SỐ|SO|CCCD|Số)[:\s]*([0-9]{12})/gi,
                        /([0-9]{12})/g
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

        cleanExtractedText(text) {
            return text
                .replace(/\s+/g, ' ')
                .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\/\-:.,]/g, '')
                .trim();
        }

        validateExtractedData(data) {
            const errors = [];

            const requiredFields = ['idNumber', 'fullName', 'dateOfBirth'];
            requiredFields.forEach(field => {
                if (!data[field] || data[field].trim().length < 2) {
                    errors.push(`Thiếu thông tin: ${this.getFieldName(field)}`);
                }
            });

            if (data.idNumber) {
                const expectedLength = this.state.selectedDocType === 'cccd' ? 12 : 9;
                if (!/^[0-9]+$/.test(data.idNumber) || data.idNumber.length !== expectedLength) {
                    errors.push('Số giấy tờ không đúng định dạng');
                }
            }

            if (data.dateOfBirth) {
                const datePattern = /^[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4}$/;
                if (!datePattern.test(data.dateOfBirth)) {
                    errors.push('Ngày sinh không đúng định dạng');
                } else {
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

        showError(message) {
            if (this.dom.errorMessage) {
                this.dom.errorMessage.textContent = message;
                this.dom.errorMessage.classList.add('visible');

                setTimeout(() => {
                    this.dom.errorMessage.classList.remove('visible');
                }, this.config.ERROR_MESSAGE_TIMEOUT);
            }
        }
    }

            window.ekycApp = new EkycApp();
});
</create_file>
