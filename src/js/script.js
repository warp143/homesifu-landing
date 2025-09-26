// HomeSifu Landing Page JavaScript

// Data Protection System - Client-side encryption for localStorage
class DataProtection {
    constructor() {
        this.secretKey = 'homesifu-security-key-2025';
        this.checkExpiringData();
    }

    // Encrypt data before storing
    encryptData(data) {
        try {
            const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), this.secretKey).toString();
            return encrypted;
        } catch (error) {
            console.warn('Encryption failed, storing as plain text:', error);
            return data;
        }
    }

    // Decrypt stored data
    decryptData(encryptedData) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            return JSON.parse(decrypted);
        } catch (error) {
            console.warn('Decryption failed, returning as is:', error);
            return encryptedData;
        }
    }

    // Set expiring localStorage data
    setExpiringData(key, data, hours = 24) {
        const expiration = Date.now() + (hours * 60 * 60 * 1000);
        const dataObject = {
            data: data,
            expiration: expiration,
            created: Date.now()
        };

        const encrypted = this.encryptData(dataObject);
        localStorage.setItem(key, encrypted);
        return true;
    }

    // Get data with expiration check
    getExpiringData(key) {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) return null;

            const decrypted = this.decryptData(stored);
            if (Date.now() > decrypted.expiration) {
                localStorage.removeItem(key);
                return null; // Data expired
            }

            return decrypted.data;
        } catch (error) {
            console.warn('Error retrieving expiring data:', error);
            return null;
        }
    }

    // Check and clean expired data
    checkExpiringData() {
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key.startsWith('exp_')) {
                    const stored = localStorage.getItem(key);
                    const decrypted = this.decryptData(stored);
                    if (Date.now() > decrypted.expiration) {
                        localStorage.removeItem(key);
                    }
                }
            }
        } catch (error) {
            console.warn('Error checking expiring data:', error);
        }
    }

    // Secure form data storage
    storeFormData(formData, formId) {
        return this.setExpiringData(`form_${formId}`, formData, 2); // 2 hours expiration
    }

    // Retrieve secure form data
    getFormData(formId) {
        return this.getExpiringData(`form_${formId}`);
    }
}

// Initialize data protection
const dataProtection = new DataProtection();

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializeHeaderScroll();
    setupScrollAnimations();
    initializePhoneFormatting();
    setupFormHandling();
    addRevealAnimations();
    addLoadingStates();
    setupLanguageSelector();
});

// Header scroll effect
function initializeHeaderScroll() {
    const header = document.querySelector('header');
    let lastScrollTop = 0;

    window.addEventListener('scroll', debounce(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.classList.add('shadow-lg');
            header.classList.remove('shadow-sm');
        } else {
            header.classList.remove('shadow-lg');
            header.classList.add('shadow-sm');
        }
        
        lastScrollTop = scrollTop;
    }, 10));
}

// Scroll animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.bg-white, .bg-gray-50, .bg-gradient-to-br');
    animateElements.forEach(el => observer.observe(el));
}

// Phone number formatting - Simple version
function initializePhoneFormatting() {
    const phoneInput = document.getElementById('userPhone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value;
        let digits = value.replace(/\D/g, '');
        
        if (digits.length === 0) {
            e.target.value = '';
            return;
        }
        
        if (digits.startsWith('60')) {
            digits = digits.substring(2);
        }
        if (digits.startsWith('0')) {
            digits = digits.substring(1);
        }
        
        let formatted = '+60 ' + digits;
        
        if (digits.length >= 2) {
            formatted = '+60 ' + digits.substring(0, 2);
            if (digits.length > 2) {
                formatted += '-' + digits.substring(2);
            }
        }
        
        if (digits.length >= 6) {
            formatted = '+60 ' + digits.substring(0, 2) + '-' + digits.substring(2, 6);
            if (digits.length > 6) {
                formatted += ' ' + digits.substring(6);
            }
        }
        
        if (digits.length >= 10) {
            formatted = '+60 ' + digits.substring(0, 2) + '-' + digits.substring(2, 6) + ' ' + digits.substring(6, 10);
            if (digits.length > 10) {
                formatted += digits.substring(10);
            }
        }
        
        if (formatted !== value) {
            e.target.value = formatted;
        }
    });
}

// Form handling
function setupFormHandling() {
    const form = document.getElementById('appointmentForm');
    if (!form) return;

    form.addEventListener('submit', handleFormSubmission);
    
    // Real-time validation
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

function handleFormSubmission(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<div class="spinner inline-block mr-2"></div>Processing...';
    
    // Simulate form submission
    setTimeout(() => {
        showSuccessMessage();
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        e.target.reset();
    }, 2000);
}

function validateForm() {
    const form = document.getElementById('appointmentForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    
    // Clear previous errors
    clearFieldError(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Email validation
    if (fieldName === 'userEmail' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, 'Please enter a valid email address');
            return false;
        }
    }
    
    // Phone validation
    if (fieldName === 'userPhone' && value) {
        const phoneRegex = /^\+60\s\d{2}-\d{4}\s\d{3,4}$/;
        if (!phoneRegex.test(value)) {
            showFieldError(field, 'Please enter a valid Malaysian phone number');
            return false;
        }
    }
    
    return true;
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message text-red-500 text-sm mt-1';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function showSuccessMessage() {
    // Get form data
    const form = document.getElementById('appointmentForm');
    const formData = new FormData(form);
    
    // Get all form values
    const userName = formData.get('userName') || '';
    const userEmail = formData.get('userEmail') || '';
    const userPhone = formData.get('userPhone') || '';
    const currentWorkflow = formData.get('currentWorkflow') || '';
    const propertyType = formData.get('propertyType') || '';
    const mainChallenge = formData.get('mainChallenge') || '';
    const portfolioSize = formData.get('portfolioSize') || '';
    const potentialObjections = formData.get('potentialObjections') || '';
    
    // Store customer details securely (NO URL exposure)
    const customerProfile = {
        name: userName,
        email: userEmail,
        phone: userPhone,
        timestamp: new Date().toISOString(),
        profile: {
            currentProcess: currentWorkflow,
            propertyType: propertyType,
            mainChallenge: mainChallenge,
            portfolioSize: portfolioSize,
            mainConcern: potentialObjections
        }
    };
    
    // Store locally for follow-up (secure)
    localStorage.setItem('homesifu_customer_profile', JSON.stringify(customerProfile));
    
    // Hide the form and show Calendly widget with FULL customer data
    document.getElementById('appointmentForm').style.display = 'none';
    
    // Format phone number for Calendly (remove formatting, keep only digits)
    let phone = userPhone.replace(/\D/g, ''); // Remove all non-digits
    
    // Build comprehensive notes for Calendly
    const notes = `Property Management Consultation Request:

Current Process: ${currentWorkflow}
Property Type: ${propertyType}
Main Challenge: ${mainChallenge}
Portfolio Size: ${portfolioSize}
Main Concern: ${potentialObjections}

This information helps us prepare a personalized demo for your specific needs.`;
    
    // Build comprehensive summary for the phone field
    const phoneSummary = `Phone: +${phone}

PROPERTY MANAGEMENT PROFILE:
Current Process: ${currentWorkflow}
Property Type: ${propertyType}
Main Challenge: ${mainChallenge}
Portfolio Size: ${portfolioSize}
Main Concern: ${potentialObjections}

This information helps us prepare a personalized demo for your specific needs.`;
    
    // Build Calendly URL with ALL customer data
    const calendlyEmbed = document.querySelector('.calendly-inline-widget');
    const calendlyUrl = new URL('https://calendly.com/charlotteyong-homesifu/30min');
    calendlyUrl.searchParams.set('name', userName);
    calendlyUrl.searchParams.set('email', userEmail);
    calendlyUrl.searchParams.set('phone', phone);
    calendlyUrl.searchParams.set('phone_country', 'MY');
    calendlyUrl.searchParams.set('notes', notes);
    
    // Try different Calendly custom field parameters for phone field with full summary
    calendlyUrl.searchParams.set('a1', phoneSummary);
    calendlyUrl.searchParams.set('a2', phoneSummary);
    calendlyUrl.searchParams.set('a3', phoneSummary);
    
    // Also try 'custom' parameters
    calendlyUrl.searchParams.set('custom[phone]', phoneSummary);
    calendlyUrl.searchParams.set('custom[Phone]', phoneSummary);
    calendlyUrl.searchParams.set('custom[Phone Number]', phoneSummary);
    
    // DESTROY and RECREATE the widget with customer data (embedded widgets don't update dynamically)
    calendlyEmbed.innerHTML = '';
    
    // Create new widget with customer data
    window.Calendly.initInlineWidget({
        url: calendlyUrl.toString(),
        parentElement: calendlyEmbed
    });
    
    document.getElementById('calendlyWidget').style.display = 'block';
    
    // Scroll to the calendar
    document.getElementById('calendlyWidget').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    
    // Track conversion (no sensitive data in tracking)
    trackConversion();
}

// Conversion tracking
function trackConversion() {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
            'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL'
        });
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead');
    }
    
    // Local storage backup
    const conversions = JSON.parse(localStorage.getItem('homesifu_conversions') || '[]');
    conversions.push({
        timestamp: new Date().toISOString(),
        type: 'strategy_call_booking'
    });
    localStorage.setItem('homesifu_conversions', JSON.stringify(conversions));
}

// Scroll reveal animations
function addRevealAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add reveal animation to sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(section);
    });
}

// Loading states
function addLoadingStates() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.type === 'submit') return; // Skip form submit buttons
            
            const originalText = this.textContent;
            this.disabled = true;
            this.innerHTML = '<div class="spinner inline-block mr-2"></div>Loading...';
            
            setTimeout(() => {
                this.disabled = false;
                this.textContent = originalText;
            }, 1000);
        });
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Add floating animation to elements
function addFloatingAnimation(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
        element.classList.add('animate-float');
    });
}

// Initialize floating animations
document.addEventListener('DOMContentLoaded', function() {
    addFloatingAnimation('.hero-visual img');
});

// Mobile menu toggle (if needed)
function toggleMobileMenu() {
    const menu = document.querySelector('.mobile-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Lazy loading for images
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
    images.forEach(img => imageObserver.observe(img));
}

// Performance optimization
function optimizePerformance() {
    // Preload critical resources
    const criticalImages = [
        'images/homesifu-logo.png',
        'images/app-screenshot.jpg'
    ];
    
    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

// Initialize performance optimizations
document.addEventListener('DOMContentLoaded', function() {
    setupLazyLoading();
    optimizePerformance();
});

// Analytics tracking
function trackPageView() {
    if (typeof gtag !== 'undefined') {
        gtag('config', 'GA_MEASUREMENT_ID', {
            page_title: document.title,
            page_location: window.location.href
        });
    }
}

// Language translations
const translations = {
    en: {
        // Header
        bookCall: "Book 15-Min Call",
        
        // Hero Section
        trustedBy: "Trusted by 5000+ Malaysian Landlords",
        heroTitle: "Manage 100 Properties in 1 Minute a Day",
        heroSubtitle: "Join 5000+ Malaysian landlords who've transformed their property management with AI-powered automation. Smart devices, automated rent collection, and real-time analytics.",
        automationRate: "Automation Rate",
        aiMonitoring: "AI Monitoring",
        mobileReady: "Mobile Ready",
        bookStrategyCall: "Book Your 15-Min Strategy Call",
        
        // Problem Section
        problemTitle: "The Property Management Challenge",
        problemSubtitle: "Traditional property management is time-consuming, error-prone, and stressful. Manual rent collection, tenant screening, and maintenance tracking drain your time and energy.",
        timeConsuming: "Time-Consuming Manual Work",
        timeConsumingDesc: "Hours spent on rent collection, tenant communication, and maintenance coordination every month.",
        paymentDelays: "Payment Delays & Errors",
        paymentDelaysDesc: "Late rent payments, manual tracking errors, and time-consuming follow-ups with tenants.",
        lackInsights: "Lack of Real-Time Insights",
        lackInsightsDesc: "No visibility into property performance, tenant behavior, or energy usage patterns.",
        
        // Solution Section
        solutionTitle: "The HomeSifu Solution",
        solutionSubtitle: "AI-powered property management platform that automates 90% of daily routines through smart device integration and intelligent workflows.",
        smartIntegration: "Smart Device Integration",
        smartIntegrationDesc: "Smart locks, meters, and payment gateways automate access control, utility monitoring, and rent collection.",
        automatedTasks: "Automated 90% of tasks",
        aiAnalytics: "AI-Powered Analytics",
        aiAnalyticsDesc: "Real-time insights into tenant behavior, energy usage, and rent trends for smarter decision-making.",
        dataInsights: "Data-driven insights",
        autopilotManagement: "Autopilot Management",
        autopilotDesc: "AI handles tenant onboarding, rent collection, and maintenance while you focus on what matters most.",
        handsFree: "Hands-free operation",
        
        // How It Works
        howItWorksTitle: "How the App Works",
        step1Title: "Smart Device Integration & Payment Gateway",
        step1Desc: "Revolutionize your property management with our app. By integrating smart lock, smart meter, and payment gateway, we automate 90% of daily routines. Streamline your tasks and enjoy more time for what matters.",
        step2Title: "Real-Time Analytics with Smarter Outcomes",
        step2Desc: "HomeSifu helps property owners unlock insights from their rental operations with real-time data analytics. From tracking tenant behavior to monitoring energy usage and rent trends, our AI-powered platform transforms raw data into actionable intelligence so you can make smarter decisions, reduce costs, and optimize every unit you manage.",
        step3Title: "Manage your properties & tenants with Autopilot",
        step3Desc: "Embrace the future of property management with our AI-driven dashboard, operating your tenant management on autopilot. Our intelligent system automates every aspect, from tenant onboarding and rent collection to maintenance management and financial tracking, ensuring smooth operations while notifying you only of issues and irregularities.",
        
        // Testimonials
        testimonialsTitle: "Satisfied Customers",
        joanQuote: "Choosing HomeSifu's subscription plan with hardware integration was a no brainer. Instead of spending over 5K upfront on smart devices, we realized we didn't need to own them; they were just tools for the system to work seamlessly. Now, we can focus on what truly matters to us.",
        raymondQuote: "🌟 I always have a 💆‍♂️ when it comes to tenant management, especially rental collection. With HomeSifu's automated rental collection integration, everything is automated. I won't need to worry about this anymore. Even following up on rental reminders and issuing letters of demand is done automatically by the system. 🙌",
        aisyahQuote: "🎉 I absolutely love HomeSifu's VR Tour service! Taking a VR tour used to cost upto 5K/property, but with their subscription plan, it's included for free. Thanks to VR tours, I've rented out my units up to x4 faster than before, saving me unnecessary traveling costs.",
        
        // Appointment Section
        appointmentTitle: "Book a 15-Minute Strategy Call",
        moneyBackSubtitle: "Book now for a free 90 days money back guarantee",
        appointmentSubtitle: "Discover how HomeSifu can transform your property management. Book your preferred 15-min time slot and get a personalized demo.",
        minuteSession: "15-Minute Session",
        personalizedDemo: "Personalized Demo",
        noObligation: "No Obligation",
        physicalDemo: "Physical Demo",
        fullName: "Full Name *",
        email: "Email *",
        phoneNumber: "Phone Number *",
        currentWorkflow: "Current Workflow",
        propertyType: "Property Type",
        mainChallenge: "Main Challenge",
        portfolioSize: "Portfolio Size",
        potentialObjections: "Potential Objections",
        selectCurrentProcess: "Select your current process",
        selectPropertyType: "Select property type",
        selectBiggestChallenge: "Select your biggest challenge",
        selectPortfolioSize: "Select portfolio size",
        selectMainConcern: "Select main concern",
        manual: "Manual management",
        spreadsheet: "Spreadsheet tracking",
        basicSoftware: "Basic property software",
        other: "Other",
        subletRoomRental: "Sublet/Room Rental",
        wholeUnitRental: "Whole Unit Rental",
        mixOfBoth: "Mix of both",
        rentCollection: "Rent collection",
        tenantManagement: "Tenant management",
        maintenance: "Maintenance coordination",
        timeManagement: "Time management",
        properties1to5: "1-5 properties",
        properties6to20: "6-20 properties",
        properties21to50: "21-50 properties",
        properties50plus: "50+ properties",
        costConcerns: "Cost concerns",
        systemComplexity: "System complexity",
        integrationIssues: "Integration issues",
        implementationTime: "Implementation time",
        noConcerns: "No concerns",
        bookStrategyCall: "Continue to Book Your Call",
        privacyNotice: "By submitting this form, you agree to receive communications from HomeSifu. We respect your privacy and will never share your information.",
        
        // CTA Section
        ctaTitle: "Ready to Transform Your Property Management?",
        ctaSubtitle: "Join 5000+ Malaysian landlords who've automated their operations with HomeSifu. Start your journey to stress-free property management today.",
        moneyBackGuarantee: "90-Day Money-Back Guarantee",
        bookNow: "Book Your 15-Min Strategy Call Now",
        
        // Footer
        footerDescription: "AI-powered property management platform that automates 90% of daily routines through smart device integration.",
        quickLinks: "Quick Links",
        company: "Company",
        contactUs: "Contact Us",
        features: "Features",
        pricing: "Pricing",
        support: "Support",
        aboutUs: "About Us",
        careers: "Careers",
        copyright: "© 2025 HomeSifu. All rights reserved.",
        
        // Form Options
        selectCurrentProcess: "Select your current process",
        selectPropertyType: "Select property type",
        selectBiggestChallenge: "Select your biggest challenge",
        selectPortfolioSize: "Select portfolio size",
        selectMainConcern: "Select main concern"
    },
    zh: {
        // Header
        bookCall: "预约15分钟通话",
        
        // Hero Section
        trustedBy: "5000+马来西亚房东信赖",
        heroTitle: "1分钟管理100套房产",
        heroSubtitle: "加入5000+马来西亚房东，通过AI驱动的自动化改造您的物业管理。智能设备、自动收租和实时分析。",
        automationRate: "自动化率",
        aiMonitoring: "AI监控",
        mobileReady: "移动就绪",
        bookStrategyCall: "预约15分钟策略通话",
        
        // Problem Section
        problemTitle: "物业管理挑战",
        problemSubtitle: "传统物业管理耗时、易出错且压力大。手动收租、租户筛选和维护跟踪消耗您的时间和精力。",
        timeConsuming: "耗时的手动工作",
        timeConsumingDesc: "每月花费数小时在收租、租户沟通和维护协调上。",
        paymentDelays: "付款延迟和错误",
        paymentDelaysDesc: "租金延迟付款、手动跟踪错误和耗时的后续跟进。",
        lackInsights: "缺乏实时洞察",
        lackInsightsDesc: "无法了解房产表现、租户行为和能源使用模式。",
        
        // Solution Section
        solutionTitle: "HomeSifu解决方案",
        solutionSubtitle: "AI驱动的物业管理平台，通过智能设备集成和智能工作流程实现90%日常任务的自动化。",
        smartIntegration: "智能设备集成",
        smartIntegrationDesc: "智能锁、电表和支付网关自动化访问控制、公用事业监控和租金收取。",
        automatedTasks: "自动化90%的任务",
        aiAnalytics: "AI驱动分析",
        aiAnalyticsDesc: "租户行为、能源使用和租金趋势的实时洞察，实现更明智的决策。",
        dataInsights: "数据驱动洞察",
        autopilotManagement: "自动驾驶管理",
        autopilotDesc: "AI处理租户入职、收租和维护，让您专注于最重要的事情。",
        handsFree: "免提操作",
        
        // How It Works
        howItWorksTitle: "应用程序工作原理",
        step1Title: "智能设备集成和支付网关",
        step1Desc: "通过我们的应用程序彻底改变您的物业管理。通过集成智能锁、智能电表和支付网关，我们自动化90%的日常例程。简化您的任务，享受更多时间做重要的事情。",
        step2Title: "实时分析和更智能的结果",
        step2Desc: "HomeSifu帮助房产所有者通过实时数据分析解锁租赁运营的洞察。从跟踪租户行为到监控能源使用和租金趋势，我们的AI驱动平台将原始数据转化为可操作的智能，让您做出更明智的决策，降低成本并优化您管理的每个单位。",
        step3Title: "使用自动驾驶管理您的房产和租户",
        step3Desc: "拥抱物业管理的未来，使用我们的AI驱动仪表板，在自动驾驶模式下运营您的租户管理。我们的智能系统自动化每个方面，从租户入职和收租到维护管理和财务跟踪，确保平稳运营，同时仅在出现问题和异常时通知您。",
        
        // Testimonials
        testimonialsTitle: "满意客户",
        joanQuote: "选择HomeSifu的硬件集成订阅计划是明智之举。我们意识到不需要拥有智能设备，它们只是系统无缝工作的工具。现在，我们可以专注于真正重要的事情。",
        raymondQuote: "🌟在租户管理方面，特别是收租方面，我总是有💆‍♂️。有了HomeSifu的自动收租集成，一切都自动化了。我不再需要担心这个。甚至跟进租金提醒和发出催款信都是系统自动完成的。🙌",
        aisyahQuote: "🎉我绝对喜欢HomeSifu的VR看房服务！VR看房过去要花费高达5K/房产，但有了他们的订阅计划，这是免费的。多亏了VR看房，我的单位出租速度提高了4倍，节省了不必要的旅行成本。",
        
        // Appointment Section
        appointmentTitle: "预约15分钟策略通话",
        moneyBackSubtitle: "立即预约享受免费90天退款保证",
        appointmentSubtitle: "了解HomeSifu如何改变您的物业管理。预约您首选的15分钟时间段并获得个性化演示。",
        minuteSession: "15分钟会议",
        personalizedDemo: "个性化演示",
        noObligation: "无义务",
        physicalDemo: "实体演示",
        fullName: "全名 *",
        email: "邮箱 *",
        phoneNumber: "电话号码 *",
        currentWorkflow: "当前工作流程",
        propertyType: "房产类型",
        mainChallenge: "主要挑战",
        portfolioSize: "投资组合规模",
        potentialObjections: "潜在异议",
        selectCurrentProcess: "选择您当前的流程",
        selectPropertyType: "选择房产类型",
        selectBiggestChallenge: "选择您最大的挑战",
        selectPortfolioSize: "选择投资组合规模",
        selectMainConcern: "选择主要关注点",
        manual: "手动管理",
        spreadsheet: "电子表格跟踪",
        basicSoftware: "基础房产软件",
        other: "其他",
        subletRoomRental: "分租/房间出租",
        wholeUnitRental: "整间单位出租",
        mixOfBoth: "两者混合",
        rentCollection: "收租",
        tenantManagement: "租户管理",
        maintenance: "维护协调",
        timeManagement: "时间管理",
        properties1to5: "1-5套房产",
        properties6to20: "6-20套房产",
        properties21to50: "21-50套房产",
        properties50plus: "50+套房产",
        costConcerns: "成本担忧",
        systemComplexity: "系统复杂性",
        integrationIssues: "集成问题",
        implementationTime: "实施时间",
        noConcerns: "无担忧",
        bookStrategyCall: "继续预约通话",
        privacyNotice: "提交此表格即表示您同意接收HomeSifu的通信。我们尊重您的隐私，绝不会分享您的信息。",
        
        // CTA Section
        ctaTitle: "准备改变您的物业管理？",
        ctaSubtitle: "加入5000+马来西亚房东，他们已通过HomeSifu自动化运营。今天开始您无压力物业管理的旅程。",
        moneyBackGuarantee: "90天退款保证",
        bookNow: "立即预约15分钟策略通话",
        
        // Footer
        footerDescription: "AI驱动的物业管理平台，通过智能设备集成实现90%日常例程的自动化。",
        quickLinks: "快速链接",
        company: "公司",
        contactUs: "联系我们",
        features: "功能",
        pricing: "定价",
        support: "支持",
        aboutUs: "关于我们",
        careers: "职业",
        copyright: "© 2025 HomeSifu. 保留所有权利。",
        
    },
    ms: {
        // Header
        bookCall: "Tempah Panggilan<br>15 Minit",
        
        // Hero Section
        trustedBy: "Dipercayai oleh 5000+ Tuan Tanah Malaysia",
        heroTitle: "Urus 100 Harta Tanah dalam 1 Minit Sehari",
        heroSubtitle: "Sertai 5000+ tuan tanah Malaysia yang telah mengubah pengurusan harta tanah mereka dengan automasi berkuasa AI. Peranti pintar, kutipan sewa automatik, dan analitik masa nyata.",
        automationRate: "Kadar Automasi",
        aiMonitoring: "Pemantauan AI",
        mobileReady: "Sedia Mobile",
        bookStrategyCall: "Tempah Panggilan Strategi 15 Minit Anda",
        
        // Problem Section
        problemTitle: "Cabaran Pengurusan Harta Tanah",
        problemSubtitle: "Pengurusan harta tanah tradisional memakan masa, mudah tersilap, dan tekanan. Kutipan sewa manual, pemeriksaan penyewa, dan penjejakan penyelenggaraan menghabiskan masa dan tenaga anda.",
        timeConsuming: "Kerja Manual Memakan Masa",
        timeConsumingDesc: "Jam yang dihabiskan untuk kutipan sewa, komunikasi penyewa, dan koordinasi penyelenggaraan setiap bulan.",
        paymentDelays: "Kelewatan & Kesilapan Pembayaran",
        paymentDelaysDesc: "Pembayaran sewa lewat, kesilapan penjejakan manual, dan susulan memakan masa dengan penyewa.",
        lackInsights: "Kekurangan Pandangan Masa Nyata",
        lackInsightsDesc: "Tiada visibiliti ke dalam prestasi harta tanah, tingkah laku penyewa, atau corak penggunaan tenaga.",
        
        // Solution Section
        solutionTitle: "Penyelesaian HomeSifu",
        solutionSubtitle: "Platform pengurusan harta tanah berkuasa AI yang mengautomasikan 90% rutin harian melalui integrasi peranti pintar dan aliran kerja pintar.",
        smartIntegration: "Integrasi Peranti Pintar",
        smartIntegrationDesc: "Kunci pintar, meter, dan gateway pembayaran mengautomasikan kawalan akses, pemantauan utiliti, dan kutipan sewa.",
        automatedTasks: "90% tugas diautomasikan",
        aiAnalytics: "Analitik Berkuasa AI",
        aiAnalyticsDesc: "Pandangan masa nyata ke dalam tingkah laku penyewa, penggunaan tenaga, dan trend sewa untuk keputusan yang lebih bijak.",
        dataInsights: "Pandangan berasaskan data",
        autopilotManagement: "Pengurusan Autopilot",
        autopilotDesc: "AI mengendalikan onboarding penyewa, kutipan sewa, dan penyelenggaraan sementara anda fokus pada perkara yang paling penting.",
        handsFree: "Operasi tanpa tangan",
        
        // How It Works
        howItWorksTitle: "Cara Aplikasi Berfungsi",
        step1Title: "Integrasi Peranti Pintar & Gateway Pembayaran",
        step1Desc: "Revolusikan pengurusan harta tanah anda dengan aplikasi kami. Dengan mengintegrasikan kunci pintar, meter pintar, dan gateway pembayaran, kami mengautomasikan 90% rutin harian. Permudahkan tugas anda dan nikmati lebih banyak masa untuk perkara yang penting.",
        step2Title: "Analitik Masa Nyata dengan Hasil yang Lebih Bijak",
        step2Desc: "HomeSifu membantu pemilik harta tanah membuka kunci pandangan dari operasi sewa mereka dengan analitik data masa nyata. Dari menjejaki tingkah laku penyewa hingga memantau penggunaan tenaga dan trend sewa, platform berkuasa AI kami mengubah data mentah menjadi kecerdasan yang boleh ditindak lanjuti supaya anda boleh membuat keputusan yang lebih bijak, mengurangkan kos, dan mengoptimumkan setiap unit yang anda uruskan.",
        step3Title: "Urus harta tanah & penyewa anda dengan Autopilot",
        step3Desc: "Terima masa depan pengurusan harta tanah dengan papan pemuka berkuasa AI kami, mengendalikan pengurusan penyewa anda pada autopilot. Sistem pintar kami mengautomasikan setiap aspek, dari onboarding penyewa dan kutipan sewa hingga pengurusan penyelenggaraan dan penjejakan kewangan, memastikan operasi yang lancar sambil memberitahu anda hanya tentang isu dan ketidakaturan.",
        
        // Testimonials
        testimonialsTitle: "Pelanggan Berpuas Hati",
        joanQuote: "Memilih pelan langganan HomeSifu dengan integrasi perkakasan adalah keputusan yang bijak. Daripada menghabiskan lebih 5K di muka untuk peranti pintar, kami sedar kami tidak perlu memilikinya; ia hanya alat untuk sistem berfungsi dengan lancar. Sekarang, kami boleh fokus pada perkara yang benar-benar penting kepada kami.",
        raymondQuote: "🌟 Saya sentiasa ada 💆‍♂️ apabila ia berkaitan dengan pengurusan penyewa, terutamanya kutipan sewa. Dengan integrasi kutipan sewa automatik HomeSifu, semuanya diautomasikan. Saya tidak perlu bimbang tentang ini lagi. Malah mengikuti pengingat sewa dan mengeluarkan surat tuntutan dilakukan secara automatik oleh sistem. 🙌",
        aisyahQuote: "🎉 Saya benar-benar suka perkhidmatan VR Tour HomeSifu! Mengambil VR tour dahulu menelan kos sehingga 5K/harta tanah, tetapi dengan pelan langganan mereka, ia termasuk secara percuma. Berkat VR tours, saya telah menyewa unit saya sehingga x4 lebih cepat daripada sebelum ini, menjimatkan kos perjalanan yang tidak perlu.",
        
        // Appointment Section
        appointmentTitle: "Tempah Panggilan Strategi 15 Minit",
        moneyBackSubtitle: "Tempah sekarang untuk jaminan wang balik 90 hari percuma",
        appointmentSubtitle: "Temui bagaimana HomeSifu boleh mengubah pengurusan harta tanah anda. Tempah slot masa 15 minit pilihan anda dan dapatkan demo peribadi.",
        minuteSession: "Sesi 15 Minit",
        personalizedDemo: "Demo Peribadi",
        noObligation: "Tiada Obligasi",
        physicalDemo: "Demo Fizikal",
        fullName: "Nama Penuh *",
        email: "E-mel *",
        phoneNumber: "Nombor Telefon *",
        currentWorkflow: "Aliran Kerja Semasa",
        propertyType: "Jenis Harta Tanah",
        mainChallenge: "Cabaran Utama",
        portfolioSize: "Saiz Portfolio",
        potentialObjections: "Bantahan Berpotensi",
        selectCurrentProcess: "Pilih proses semasa anda",
        selectPropertyType: "Pilih jenis harta tanah",
        selectBiggestChallenge: "Pilih cabaran terbesar anda",
        selectPortfolioSize: "Pilih saiz portfolio",
        selectMainConcern: "Pilih kebimbangan utama",
        manual: "Pengurusan manual",
        spreadsheet: "Penjejakan spreadsheet",
        basicSoftware: "Perisian harta tanah asas",
        other: "Lain-lain",
        subletRoomRental: "Sewa Bilik/Sublet",
        wholeUnitRental: "Sewa Unit Penuh",
        mixOfBoth: "Campuran Kedua-duanya",
        rentCollection: "Kutipan sewa",
        tenantManagement: "Pengurusan penyewa",
        maintenance: "Koordinasi penyelenggaraan",
        timeManagement: "Pengurusan masa",
        properties1to5: "1-5 harta tanah",
        properties6to20: "6-20 harta tanah",
        properties21to50: "21-50 harta tanah",
        properties50plus: "50+ harta tanah",
        costConcerns: "Kebimbangan kos",
        systemComplexity: "Kerumitan sistem",
        integrationIssues: "Isu integrasi",
        implementationTime: "Masa pelaksanaan",
        noConcerns: "Tiada kebimbangan",
        bookStrategyCall: "Teruskan untuk Tempah Panggilan",
        privacyNotice: "Dengan menghantar borang ini, anda bersetuju untuk menerima komunikasi dari HomeSifu. Kami menghormati privasi anda dan tidak akan pernah berkongsi maklumat anda.",
        
        // CTA Section
        ctaTitle: "Sedia untuk Mengubah Pengurusan Harta Tanah Anda?",
        ctaSubtitle: "Sertai 5000+ tuan tanah Malaysia yang telah mengautomasikan operasi mereka dengan HomeSifu. Mulakan perjalanan anda ke pengurusan harta tanah tanpa tekanan hari ini.",
        moneyBackGuarantee: "Jaminan Wang Balik 90 Hari",
        bookNow: "Tempah Panggilan Strategi 15 Minit Anda Sekarang",
        
        // Footer
        footerDescription: "Platform pengurusan harta tanah berkuasa AI yang mengautomasikan 90% rutin harian melalui integrasi peranti pintar.",
        quickLinks: "Pautan Pantas",
        company: "Syarikat",
        contactUs: "Hubungi Kami",
        features: "Ciri-ciri",
        pricing: "Harga",
        support: "Sokongan",
        aboutUs: "Tentang Kami",
        careers: "Kerjaya",
        copyright: "© 2025 HomeSifu. Hak cipta terpelihara."
    }
};

// Language selector functionality
function setupLanguageSelector() {
    const languageSelector = document.getElementById('languageSelector');
    if (!languageSelector) return;

    // Set default language
    const savedLanguage = localStorage.getItem('homesifu_language') || 'en';
    languageSelector.value = savedLanguage;
    
    // Apply saved language
    changeLanguage(savedLanguage);

    // Add event listener
    languageSelector.addEventListener('change', function() {
        const selectedLanguage = this.value;
        localStorage.setItem('homesifu_language', selectedLanguage);
        changeLanguage(selectedLanguage);
    });
}

function changeLanguage(language) {
    const currentLang = translations[language];
    if (!currentLang) return;

    // Update all text content
    updateTextContent('bookCall', currentLang.bookCall);
    updateTextContent('trustedBy', currentLang.trustedBy);
    updateTextContent('heroTitle', currentLang.heroTitle);
    updateTextContent('heroSubtitle', currentLang.heroSubtitle);
    updateTextContent('automationRate', currentLang.automationRate);
    updateTextContent('aiMonitoring', currentLang.aiMonitoring);
    updateTextContent('mobileReady', currentLang.mobileReady);
    updateTextContent('bookStrategyCall', currentLang.bookStrategyCall);
    
    // Update problem section
    updateTextContent('problemTitle', currentLang.problemTitle);
    updateTextContent('problemSubtitle', currentLang.problemSubtitle);
    updateTextContent('timeConsuming', currentLang.timeConsuming);
    updateTextContent('timeConsumingDesc', currentLang.timeConsumingDesc);
    updateTextContent('paymentDelays', currentLang.paymentDelays);
    updateTextContent('paymentDelaysDesc', currentLang.paymentDelaysDesc);
    updateTextContent('lackInsights', currentLang.lackInsights);
    updateTextContent('lackInsightsDesc', currentLang.lackInsightsDesc);
    
    // Update solution section
    updateTextContent('solutionTitle', currentLang.solutionTitle);
    updateTextContent('solutionSubtitle', currentLang.solutionSubtitle);
    updateTextContent('smartIntegration', currentLang.smartIntegration);
    updateTextContent('smartIntegrationDesc', currentLang.smartIntegrationDesc);
    updateTextContent('automatedTasks', currentLang.automatedTasks);
    updateTextContent('aiAnalytics', currentLang.aiAnalytics);
    updateTextContent('aiAnalyticsDesc', currentLang.aiAnalyticsDesc);
    updateTextContent('dataInsights', currentLang.dataInsights);
    updateTextContent('autopilotManagement', currentLang.autopilotManagement);
    updateTextContent('autopilotDesc', currentLang.autopilotDesc);
    updateTextContent('handsFree', currentLang.handsFree);
    
    // Update how it works section
    updateTextContent('howItWorksTitle', currentLang.howItWorksTitle);
    updateTextContent('step1Title', currentLang.step1Title);
    updateTextContent('step1Desc', currentLang.step1Desc);
    updateTextContent('step2Title', currentLang.step2Title);
    updateTextContent('step2Desc', currentLang.step2Desc);
    updateTextContent('step3Title', currentLang.step3Title);
    updateTextContent('step3Desc', currentLang.step3Desc);
    
    // Update testimonials
    updateTextContent('testimonialsTitle', currentLang.testimonialsTitle);
    updateTextContent('joanQuote', currentLang.joanQuote);
    updateTextContent('raymondQuote', currentLang.raymondQuote);
    updateTextContent('aisyahQuote', currentLang.aisyahQuote);
    
    // Update appointment section
    updateTextContent('appointmentTitle', currentLang.appointmentTitle);
    updateTextContent('moneyBackSubtitle', currentLang.moneyBackSubtitle);
    updateTextContent('appointmentSubtitle', currentLang.appointmentSubtitle);
    updateTextContent('minuteSession', currentLang.minuteSession);
    updateTextContent('personalizedDemo', currentLang.personalizedDemo);
    updateTextContent('noObligation', currentLang.noObligation);
    updateTextContent('physicalDemo', currentLang.physicalDemo);
    updateTextContent('fullName', currentLang.fullName);
    updateTextContent('email', currentLang.email);
    updateTextContent('phoneNumber', currentLang.phoneNumber);
    updateTextContent('currentWorkflow', currentLang.currentWorkflow);
    updateTextContent('propertyType', currentLang.propertyType);
    updateTextContent('mainChallenge', currentLang.mainChallenge);
    updateTextContent('portfolioSize', currentLang.portfolioSize);
    updateTextContent('potentialObjections', currentLang.potentialObjections);
    updateTextContent('bookStrategyCall', currentLang.bookStrategyCall);
    updateTextContent('privacyNotice', currentLang.privacyNotice);
    
    // Update CTA section
    updateTextContent('ctaTitle', currentLang.ctaTitle);
    updateTextContent('ctaSubtitle', currentLang.ctaSubtitle);
    updateTextContent('moneyBackGuarantee', currentLang.moneyBackGuarantee);
    updateTextContent('bookNow', currentLang.bookNow);
    
    // Update footer
    updateTextContent('footerDescription', currentLang.footerDescription);
    updateTextContent('quickLinks', currentLang.quickLinks);
    updateTextContent('company', currentLang.company);
    updateTextContent('contactUs', currentLang.contactUs);
    updateTextContent('features', currentLang.features);
    updateTextContent('pricing', currentLang.pricing);
    updateTextContent('support', currentLang.support);
    updateTextContent('aboutUs', currentLang.aboutUs);
    updateTextContent('careers', currentLang.careers);
    updateTextContent('copyright', currentLang.copyright);
    
    // Update form options
    updateTextContent('selectCurrentProcess', currentLang.selectCurrentProcess);
    updateTextContent('selectPropertyType', currentLang.selectPropertyType);
    updateTextContent('selectBiggestChallenge', currentLang.selectBiggestChallenge);
    updateTextContent('selectPortfolioSize', currentLang.selectPortfolioSize);
    updateTextContent('selectMainConcern', currentLang.selectMainConcern);
    
    // Update form option values
    updateTextContent('manual', currentLang.manual);
    updateTextContent('spreadsheet', currentLang.spreadsheet);
    updateTextContent('basicSoftware', currentLang.basicSoftware);
    updateTextContent('other', currentLang.other);
    
    // Adjust text size for Malay language
    const bookCallButton = document.querySelector('[data-translate="bookCall"]');
    if (bookCallButton) {
        if (language === 'ms') {
            bookCallButton.classList.remove('text-sm');
            bookCallButton.classList.add('text-xs');
        } else {
            bookCallButton.classList.remove('text-xs');
            bookCallButton.classList.add('text-sm');
        }
    }
    updateTextContent('subletRoomRental', currentLang.subletRoomRental);
    updateTextContent('wholeUnitRental', currentLang.wholeUnitRental);
    updateTextContent('mixOfBoth', currentLang.mixOfBoth);
    updateTextContent('rentCollection', currentLang.rentCollection);
    updateTextContent('tenantManagement', currentLang.tenantManagement);
    updateTextContent('maintenance', currentLang.maintenance);
    updateTextContent('timeManagement', currentLang.timeManagement);
    updateTextContent('properties1to5', currentLang.properties1to5);
    updateTextContent('properties6to20', currentLang.properties6to20);
    updateTextContent('properties21to50', currentLang.properties21to50);
    updateTextContent('properties50plus', currentLang.properties50plus);
    updateTextContent('costConcerns', currentLang.costConcerns);
    updateTextContent('systemComplexity', currentLang.systemComplexity);
    updateTextContent('integrationIssues', currentLang.integrationIssues);
    updateTextContent('implementationTime', currentLang.implementationTime);
    updateTextContent('noConcerns', currentLang.noConcerns);
}

function updateTextContent(key, text) {
    const elements = document.querySelectorAll(`[data-translate="${key}"]`);
    elements.forEach(element => {
        element.innerHTML = text;
    });
}

// Track page view on load
document.addEventListener('DOMContentLoaded', trackPageView);

// Listen for Calendly events to handle booking completion
window.addEventListener('message', function(e) {
    if (e.data.event && e.data.event.indexOf('calendly') === 0) {
        if (e.data.event === 'calendly.event_scheduled') {
            handleCalendlyBooking(e.data.payload);
        }
    }
});

// Handle successful Calendly booking
function handleCalendlyBooking(payload) {
    // Get stored customer profile
    const customerProfile = JSON.parse(localStorage.getItem('homesifu_customer_profile') || '{}');
    
    // Combine booking info with customer profile
    const completeBookingData = {
        booking: payload,
        customerProfile: customerProfile,
        timestamp: new Date().toISOString()
    };
    
    // Store complete booking info
    localStorage.setItem('homesifu_completed_booking', JSON.stringify(completeBookingData));
    
    // Show success message
    showBookingSuccess();
    
    // TODO: Send customer profile to your internal system via secure webhook
    // This replaces the insecure URL parameter method
    console.log('Booking completed with customer profile:', completeBookingData);
}

// Show booking success message
function showBookingSuccess() {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50';
    successDiv.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4">
            <div class="text-center">
                <div class="text-green-500 text-5xl mb-4">✅</div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                <p class="text-gray-600 mb-4">Your strategy call has been scheduled. We'll use the information you provided to prepare a personalized demo for your specific needs.</p>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="bg-blue-600 text-white px-6 py-2 rounded-lg">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(successDiv);
}
