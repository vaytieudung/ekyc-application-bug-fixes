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
