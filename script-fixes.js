// eKYC Application Fixes - Addressing OCR/Validation and Step 5 Issues
class EKYCFixes {
    constructor() {
        this.ocrWorker = null;
        this.validationErrors = [];
        this.crossValidationData = {};
        this.step5Data = {};
    }

    // Fix 1: Enhanced OCR with better Vietnamese support
    async initializeOCR() {
        try {
            this.ocrWorker = await Tesseract.createWorker(['vie', 'eng'], 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR Progress: ${(m.progress * 100).toFixed(2)}%`);
                    }
                },
                errorHandler: (error) => {
                    console.error('OCR Error:', error);
                    this.handleOCRError(error);
                }
            });
            
            // Load Vietnamese trained data
            await this.ocrWorker.loadLanguage('vie');
            await this.ocrWorker.initialize('vie');
            
            console.log('OCR initialized with Vietnamese support');
            return true;
        } catch (error) {
            console.error('Failed to initialize OCR:', error);
            return false;
        }
    }

    // Fix 2: Improved OCR data extraction with validation
    async extractAndValidateOCR(imageData, type) {
        if (!this.ocrWorker) {
            const initialized = await this.initializeOCR();
            if (!initialized) {
                throw new Error('OCR initialization failed');
            }
        }

        try {
            this.showLoading('Đang đọc thông tin từ ảnh...');
            
            const { data: { text, confidence } } = await this.ocrWorker.recognize(imageData);
            
            if (confidence < 30) {
                throw new Error('Ảnh quá mờ hoặc chất lượng không đủ để đọc');
            }

            const extractedData = this.parseVietnameseID(text, type);
            const validation = this.validateExtractedData(extractedData, type);
            
            if (!validation.isValid) {
                this.showValidationErrors(validation.errors);
                return { success: false, errors: validation.errors };
            }

            // Store for cross-validation
            this.crossValidationData[type] = extractedData;
            
            // Cross-validate if both front and back are available
            if (this.crossValidationData.front && this.crossValidationData.back) {
                const crossValidation = this.crossValidateIDs();
                if (!crossValidation.isValid) {
                    this.showValidationErrors(crossValidation.errors);
                    return { success: false, errors: crossValidation.errors };
                }
            }

            return { success: true, data: extractedData, confidence };
            
        } catch (error) {
            console.error('OCR processing error:', error);
            return { 
                success: false, 
                errors: [error.message || 'Không thể đọc thông tin từ ảnh'] 
            };
        } finally {
            this.hideLoading();
        }
    }

    // Enhanced Vietnamese ID parsing
    parseVietnameseID(text, type) {
        const data = {};
        
        // Vietnamese patterns for different document types
        const patterns = {
            cccd: {
                idNumber: /(?:SỐ|SO|CCCD)[:\s]*([0-9]{12})/i,
                fullName: /(?:HỌ VÀ TÊN|HO VA TEN)[:\s]*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ ]{2,})/i,
                dateOfBirth: /(?:NGÀY SINH|NGAY SINH)[:\s]*([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i,
                placeOfOrigin: /(?:QUÊ QUÁN|QUE QUAN)[:\s]*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ ]{2,})/i,
                placeOfResidence: /(?:NƠI THƯỜNG TRÚ|NOI THUONG TRU)[:\s]*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ ]{2,})/i
            },
            cmnd: {
                idNumber: /(?:SỐ|SO|CMND)[:\s]*([0-9]{9})/i,
                fullName: /(?:HỌ VÀ TÊN|HO VA TEN)[:\s]*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ ]{2,})/i,
                dateOfBirth: /(?:NGÀY SINH|NGAY SINH)[:\s]*([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i
            }
        };

        // Extract data using appropriate patterns
        const docPatterns = patterns[this.data.docType] || patterns.cccd;
        
        Object.keys(docPatterns).forEach(key => {
            const match = text.match(docPatterns[key]);
            if (match) {
                data[key] = match[1].trim();
            }
        });

        // Additional processing for back side
        if (type === 'back') {
            const issueDateMatch = text.match(/(?:NGÀY CẤP|NGAY CAP)[:\s]*([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i);
            if (issueDateMatch) {
                data.issueDate = issueDateMatch[1];
            }
            
            const issuePlaceMatch = text.match(/(?:NƠI CẤP|NOI CAP)[:\s]*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ ]{2,})/i);
            if (issuePlaceMatch) {
                data.issuePlace = issuePlaceMatch[1].trim();
            }
        }

        return data;
    }

    // Validate extracted data
    validateExtractedData(data, type) {
        const errors = [];
        const requiredFields = {
            cccd: ['idNumber', 'fullName', 'dateOfBirth', 'placeOfOrigin', 'placeOfResidence'],
            cmnd: ['idNumber', 'fullName', 'dateOfBirth']
        };

        const docType = this.data.docType || 'cccd';
        const required = requiredFields[docType] || requiredFields.cccd;

        required.forEach(field => {
            if (!data[field] || data[field].trim() === '') {
                errors.push(`Thiếu thông tin: ${this.getFieldName(field)}`);
            }
        });

        // Validate ID number format
        if (data.idNumber) {
            const idPattern = docType === 'cccd' ? /^[0-9]{12}$/ : /^[0-9]{9}$/;
            if (!idPattern.test(data.idNumber)) {
                errors.push(`Số ${docType.toUpperCase()} không đúng định dạng`);
            }
        }

        // Validate date format
        if (data.dateOfBirth) {
            const datePattern = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/;
            const match = data.dateOfBirth.match(datePattern);
            if (!match) {
                errors.push('Ngày sinh không đúng định dạng (dd/mm/yyyy)');
            } else {
                const day = parseInt(match[1]);
                const month = parseInt(match[2]);
                const year = parseInt(match[3]);
                
                if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
                    errors.push('Ngày sinh không hợp lệ');
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Cross-validate front and back ID numbers
    crossValidateIDs() {
        const front = this.crossValidationData.front;
        const back = this.crossValidationData.back;
        
        if (!front || !back) {
            return { isValid: true, errors: [] };
        }

        const errors = [];
        
        if (front.idNumber && back.idNumber && front.idNumber !== back.idNumber) {
            errors.push('Số CMND/CCCD không khớp giữa mặt trước và mặt sau');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Fix 3: Enhanced data storage and retrieval for step 5
    storeStepData(step, data) {
        try {
            const storageKey = `ekyc_step_${step}`;
            const storageData = {
                ...data,
                timestamp: new Date().toISOString(),
                step: step
            };
            
            localStorage.setItem(storageKey, JSON.stringify(storageData));
            this.step5Data[step] = storageData;
            
            console.log(`Stored data for step ${step}:`, storageData);
            return true;
        } catch (error) {
            console.error('Error storing step data:', error);
            return false;
        }
    }

    retrieveStepData(step) {
        try {
            const storageKey = `ekyc_step_${step}`;
            const stored = localStorage.getItem(storageKey);
            
            if (stored) {
                const data = JSON.parse(stored);
                this.step5Data[step] = data;
                return data;
            }
            
            return this.step5Data[step] || null;
        } catch (error) {
            console.error('Error retrieving step data:', error);
            return null;
        }
    }

    // Fix 4: Enhanced step 5 display with proper data flow
    async loadStep5Data() {
        try {
            this.showLoading('Đang tải thông tin xem lại...');
            
            const step1Data = this.retrieveStepData(1);
            const step2Data = this.retrieveStepData(2);
            const step3Data = this.retrieveStepData(3);
            const step4Data = this.retrieveStepData(4);
            
            const reviewData = {
                documentType: step1Data?.docType || 'Chưa chọn',
                frontImage: step2Data?.imageData || null,
                backImage: step3Data?.imageData || null,
                faceImage: step4Data?.imageData || null,
                extractedInfo: {
                    ...this.crossValidationData.front,
                    ...this.crossValidationData.back
                },
                validationStatus: this.validationErrors.length === 0 ? 'Valid' : 'Invalid',
                errors: this.validationErrors
            };

            this.populateStep5Display(reviewData);
            
            return reviewData;
            
        } catch (error) {
            console.error('Error loading step 5 data:', error);
            this.showError('Không thể tải thông tin xem lại');
            return null;
        } finally {
            this.hideLoading();
        }
    }

    populateStep5Display(data) {
        if (!data) return;

        // Populate document type
        const docTypeElement = document.getElementById('reviewDocType');
        if (docTypeElement) {
            docTypeElement.textContent = this.getDocumentTypeName(data.documentType);
        }

        // Populate images
        ['front', 'back', 'face'].forEach(type => {
            const imgElement = document.getElementById(`review${type.charAt(0).toUpperCase() + type.slice(1)}`);
            if (imgElement && data[`${type}Image`]) {
                imgElement.src = data[`${type}Image`];
                imgElement.style.display = 'block';
            }
        });

        // Populate extracted information
        const infoContainer = document.getElementById('reviewInfo');
        if (infoContainer) {
            infoContainer.innerHTML = '';
            
            Object.entries(data.extractedInfo).forEach(([key, value]) => {
                if (value) {
                    const infoRow = document.createElement('div');
                    infoRow.className = 'info-row';
                    infoRow.innerHTML = `
                        <div class="info-label">${this.getFieldName(key)}</div>
                        <div class="info-value">${value}</div>
                    `;
                    infoContainer.appendChild(infoRow);
                }
            });
        }

        // Show validation status
        const statusElement = document.getElementById('validationStatus');
        if (statusElement) {
            statusElement.textContent = data.validationStatus === 'Valid' 
                ? 'Tất cả thông tin đã được xác thực' 
                : 'Có lỗi cần kiểm tra lại';
            statusElement.className = data.validationStatus === 'Valid' ? 'status-valid' : 'status-invalid';
        }

        // Show errors if any
        if (data.errors && data.errors.length > 0) {
            this.displayStep5Errors(data.errors);
        }
    }

    displayStep5Errors(errors) {
        const errorContainer = document.getElementById('step5Errors');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <h4>Các lỗi cần kiểm tra:</h4>
                <ul>
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            `;
            errorContainer.style.display = 'block';
        }
    }

    // Fix 5: Fallback for OCR failures
    async handleOCRError(error) {
        console.error('OCR Error:', error);
        
        // Show user-friendly error
        const errorMessage = `
            Không thể đọc thông tin từ ảnh. Nguyên nhân có thể:
            • Ảnh quá mờ hoặc thiếu sáng
            • Giấy tờ bị che khuất một phần
            • Định dạng giấy tờ không được hỗ trợ
            
            Bạn có thể:
            1. Chụp lại ảnh với chất lượng tốt hơn
            2. Nhập thông tin thủ công
        `;
        
        this.showError(errorMessage);
        
        // Provide manual input option
        return this.showManualInputDialog();
    }

    showManualInputDialog() {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'manual-input-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <h3>Nhập thông tin thủ công</h3>
                    <form id="manualInputForm">
                        <div class="form-group">
                            <label>Số CMND/CCCD:</label>
                            <input type="text" id="manualIdNumber" required>
                        </div>
                        <div class="form-group">
                            <label>Họ và tên:</label>
                            <input type="text" id="manualFullName" required>
                        </div>
                        <div class="form-group">
                            <label>Ngày sinh:</label>
                            <input type="date" id="manualDob" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="this.parentElement.parentElement.remove()">Hủy</button>
                            <button type="submit">Xác nhận</button>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            dialog.querySelector('form').addEventListener('submit', (e) => {
                e.preventDefault();
                const data = {
                    idNumber: document.getElementById('manualIdNumber').value,
                    fullName: document.getElementById('manualFullName').value,
                    dateOfBirth: document.getElementById('manualDob').value
                };
                dialog.remove();
                resolve({ success: true, data, manual: true });
            });
        });
    }

    // Fix 6: Enhanced error handling and user feedback
    showError(message) {
        const errorDiv = document.getElementById('error');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorDiv && errorMessage) {
            errorMessage.innerHTML = message;
            errorDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    showLoading(message) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.querySelector('p').textContent = message;
            loading.style.display = 'flex';
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    // Utility functions
    getFieldName(key) {
        const names = {
            idNumber: 'Số CMND/CCCD',
            fullName: 'Họ và tên',
            dateOfBirth: 'Ngày sinh',
            placeOfOrigin: 'Quê quán',
            placeOfResidence: 'Nơi thường trú',
            issueDate: 'Ngày cấp',
            issuePlace: 'Nơi cấp'
        };
        return names[key] || key;
    }

    getDocumentTypeName(type) {
        const names = {
            cccd: 'Căn cước công dân',
            cmnd: 'Chứng minh nhân dân',
            passport: 'Hộ chiếu'
        };
        return names[type] || type;
    }

    // Cleanup function
    cleanup() {
        if (this.ocrWorker) {
            this.ocrWorker.terminate();
            this.ocrWorker = null;
        }
        
        // Clear localStorage
        for (let i = 1; i <= 5; i++) {
            localStorage.removeItem(`ekyc_step_${i}`);
        }
    }
}

// Global instance
window.ekycFixes = new EKYCFixes();