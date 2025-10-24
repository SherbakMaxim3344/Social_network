
// ИМПОРТ СТИЛЕЙ - ДОБАВЬТЕ ЭТУ СТРОЧКУ
import '../less/main.less';

class SocialNetwork {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.applyRedDarkTheme();
        console.log('Social Network Red Dark Theme initialized');
    }

    applyRedDarkTheme() {
        // Добавляем классы для красной темной темы
        document.body.classList.add('dark-theme', 'red-theme');
        
        // Применяем градиент к навигации
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
        }
        
        this.enhanceCards();
    }

    enhanceCards() {
        const cards = document.querySelectorAll('.user-card, .friend-card, .news-post');
        cards.forEach(card => {
            card.style.transition = 'all 0.4s ease';
            
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.boxShadow = '0 12px 40px rgba(220, 38, 38, 0.3)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '';
            });
        });

        this.enhanceBadges();
    }

    enhanceBadges() {
        const badges = document.querySelectorAll('.badge');
        badges.forEach(badge => {
            badge.style.transition = 'all 0.3s ease';
            
            badge.addEventListener('mouseenter', () => {
                badge.style.transform = 'scale(1.1)';
                badge.style.filter = 'brightness(1.2)';
            });
            
            badge.addEventListener('mouseleave', () => {
                badge.style.transform = 'scale(1)';
                badge.style.filter = 'brightness(1)';
            });
        });
    }

    bindEvents() {
        // Добавляем интерактивность
        this.addSmoothAnimations();
        
        // Обработчики для кнопок
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn')) {
                this.handleButtonClick(e.target);
            }
        });
    }

    addSmoothAnimations() {
        // Плавное появление элементов
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Наблюдаем за карточками
        document.querySelectorAll('.user-card, .news-post').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
            observer.observe(el);
        });
    }

    handleButtonClick(button) {
        // Анимация нажатия кнопки
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px; 
            right: 20px; 
            z-index: 1050; 
            min-width: 350px;
            background: linear-gradient(135deg, var(--bs-${type}), #b91c1c);
            color: white;
            border: none;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
            border-left: 4px solid #ff6b6b;
            font-weight: 600;
        `;
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
                <strong>${message}</strong>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    new SocialNetwork();
});

// CSS переменные для красной темы
const style = document.createElement('style');
style.textContent = `
    :root {
        --primary-red: #dc2626;
        --dark-bg: #0f0f0f;
        --dark-card: #1a1a1a;
        --text-white: #ffffff;
    }
    
    .red-theme {
        color-scheme: dark;
    }
`;
document.head.appendChild(style);