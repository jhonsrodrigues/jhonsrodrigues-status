document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    const SERVICES_DATA_URL = './history/summary.json';
    
    // Custom logos mapping based on slug
    const LOGOS = {
        'jhons-rodrigues': 'https://tyipxaldonkfqlztqmbk.supabase.co/storage/v1/object/public/public-images/LogotipoJR.png',
        'xyz-tools': 'https://tyipxaldonkfqlztqmbk.supabase.co/storage/v1/object/public/public-images/LogoXYZquadrado.svg',
        'xyz-guard-beta': 'https://tyipxaldonkfqlztqmbk.supabase.co/storage/v1/object/public/public-images/Logotipo%20XYZ%20Vermelho.png'
    };

    const globalStatusBanner = document.getElementById('global-status-banner');
    const globalStatusText = document.getElementById('global-status-text');
    const servicesGrid = document.getElementById('services-grid');
    const lastUpdatedText = document.getElementById('last-updated-text');

    async function fetchStatusData() {
        try {
            const response = await fetch(SERVICES_DATA_URL);
            if (!response.ok) {
                throw new Error('Falha ao carregar os dados de status.');
            }
            const data = await response.json();
            renderStatus(data);
        } catch (error) {
            console.error('Error fetching status:', error);
            showErrorState();
        }
    }

    // Security: Função para sanitizar HTML e evitar XSS (Cross-Site Scripting)
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    }

    function renderStatus(services) {
        // Clear skeletons
        servicesGrid.innerHTML = '';

        let allSystemsUp = true;
        let hasDegraded = false;

        services.forEach((service, index) => {
            if (service.status !== 'up') {
                allSystemsUp = false;
            }

            // Map custom logo or fallback to default icon
            const customLogo = LOGOS[service.slug] || service.icon || 'https://icons.duckduckgo.com/ip3/' + new URL(service.url).hostname + '.ico';

            // Calculate delay for staggered animation
            const animationDelay = 0.4 + (index * 0.1);

            const isUp = service.status === 'up';
            const statusText = isUp ? 'Operacional' : 'Com Instabilidade';
            const statusClass = isUp ? 'status-up' : 'status-down';
            
            // Format uptime (fallback to generic if missing)
            const uptimeText = service.uptime ? `Disponibilidade de ${service.uptime} nos últimos 30 dias` : 'Verificando...';

            const card = document.createElement('div');
            card.className = 'service-card';
            card.style.animationDelay = `${animationDelay}s`;
            
            // Format recent incidents
            let incidentsHtml = '<p>Nenhum incidente registrado recentemente. Sistema 100% operacional.</p>';
            if (service.dailyMinutesDown && Object.keys(service.dailyMinutesDown).length > 0) {
                const recentDates = Object.keys(service.dailyMinutesDown).slice(-3).reverse();
                incidentsHtml = '<ul style="list-style: none; padding: 0;">';
                recentDates.forEach(date => {
                    const safeDate = escapeHTML(date);
                    const safeMinutes = escapeHTML(String(service.dailyMinutesDown[date]));
                    incidentsHtml += `<li style="margin-bottom: 0.25rem; color: var(--status-down);">⚠️ ${safeDate}: ${safeMinutes} minuto(s) de inatividade</li>`;
                });
                incidentsHtml += '</ul>';
            }

            const safeName = escapeHTML(service.name);
            const safeUptimeText = escapeHTML(uptimeText);
            const safeUrl = encodeURI(service.url);
            
            card.innerHTML = `
                <div class="service-header-clickable">
                    <div class="service-info">
                        <div class="service-icon">
                            <img src="${customLogo}" alt="${safeName} logo" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=random&color=fff'">
                        </div>
                        <div class="service-details">
                            <h3>${safeName}</h3>
                            <span class="service-uptime">${safeUptimeText}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div class="service-status ${statusClass}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                ${isUp 
                                    ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' 
                                    : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
                                }
                            </svg>
                            <span>${statusText}</span>
                        </div>
                        <svg class="card-dropdown-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>
                <div class="service-details-dropdown">
                    <div class="dropdown-content-inner">
                        <div class="incidents-log">
                            <h4>Últimos Incidentes</h4>
                            ${incidentsHtml}
                        </div>
                        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="visit-site-btn">
                            Acessar Site
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>
                    </div>
                </div>
            `;
            
            // Toggle accordion
            const header = card.querySelector('.service-header-clickable');
            header.addEventListener('click', () => {
                const isExpanded = card.classList.contains('expanded');
                // Close all other cards (optional, accordion behavior)
                document.querySelectorAll('.service-card').forEach(c => c.classList.remove('expanded'));
                if (!isExpanded) {
                    card.classList.add('expanded');
                }
            });

            servicesGrid.appendChild(card);
        });

        // Update Global Status
        globalStatusBanner.classList.remove('loading');
        if (allSystemsUp) {
            globalStatusBanner.classList.add('all-up');
            globalStatusText.textContent = 'Todos os sistemas estão operacionais.';
        } else {
            globalStatusBanner.classList.add('has-issues');
            globalStatusText.textContent = 'Alguns sistemas apresentam instabilidade.';
        }

        // Update Last Updated time
        const now = new Date();
        lastUpdatedText.textContent = `Atualizado às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    function showErrorState() {
        globalStatusBanner.classList.remove('loading');
        globalStatusBanner.classList.add('has-issues');
        globalStatusText.textContent = 'Falha ao recuperar dados do sistema.';
        servicesGrid.innerHTML = `
            <div class="service-card" style="justify-content: center; color: var(--text-secondary)">
                <p>Não foi possível carregar os serviços no momento. Tente novamente mais tarde.</p>
            </div>
        `;
    }

    // Initialize
    fetchStatusData();
});

// Global copy email function
function copySupportEmail() {
    const email = 'suporte@jhonsrodrigues.com';
    navigator.clipboard.writeText(email).then(() => {
        const feedback = document.getElementById('copy-feedback');
        feedback.classList.add('show');
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 2000);
    }).catch(err => {
        console.error('Falha ao copiar email: ', err);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const copyBtn = document.getElementById('copy-email-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copySupportEmail);
    }
});
