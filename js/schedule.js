document.addEventListener('DOMContentLoaded', async () => {
    const containerId = 'scheduleDisplayView';
    let container = document.getElementById(containerId);

    // If the frontend container element is missing, initialize it cleanly
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);
    }

    // Build decoupled, safe style bindings to prevent leaking into your admin panels
    const styleBlock = document.createElement('style');
    styleBlock.innerHTML = `
        #scheduleDisplayView {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            overflow: hidden !important;
            background: #000 !important;
            z-index: 1 !important;
        }
        .kb-slideshow-frame {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 1500ms ease-in-out;
            background-size: cover;
            background-position: center;
            transform: scale(1);
        }
        .kb-slideshow-frame.active-slide {
            opacity: 1;
            animation: safeKenBurnsEffect var(--kb-duration, 6000ms) ease-in-out forwards;
        }
        @keyframes safeKenBurnsEffect {
            0% { transform: scale(1); }
            100% { transform: scale(1.08); }
        }
    `;
    document.head.appendChild(styleBlock);

    try {
        const client = typeof supabaseClient !== 'undefined' ? supabaseClient : null;
        if (!client) return;

        // 1. Fetch Rotation Configuration settings
        const { data: settingsData } = await client.from('settings').select('schedule_seconds').limit(1).single();
        const intervalMs = (settingsData && settingsData.schedule_seconds ? parseInt(settingsData.schedule_seconds, 10) : 5) * 1000;

        // 2. Fetch active layout rows 
        const { data: activeSlides, error } = await client
            .from('schedule_slots')
            .select('url')
            .eq('enabled', true)
            .neq('url', '')
            .order('slot', { ascending: true });

        if (error || !activeSlides || activeSlides.length === 0) {
            container.innerHTML = '<div style="color:#555; display:flex; justify-content:center; align-items:center; height:100%; font-family:sans-serif;">No active schedules loaded.</div>';
            return;
        }

        // Build runtime structures inside isolated canvas block
        container.innerHTML = activeSlides.map((slide, idx) => `
            <div class="kb-slideshow-frame ${idx === 0 ? 'active-slide' : ''}" style="background-image: url('${slide.url}'); --kb-duration: ${intervalMs + 1500}ms;"></div>
        `).join('');

        if (activeSlides.length > 1) {
            let currentIndex = 0;
            const slidesElements = container.querySelectorAll('.kb-slideshow-frame');

            setInterval(() => {
                slidesElements[currentIndex].classList.remove('active-slide');
                currentIndex = (currentIndex + 1) % slidesElements.length;
                slidesElements[currentIndex].classList.add('active-slide');
            }, intervalMs);
        }
    } catch (err) {
        console.error('Failed processing display scheduler sequence: ', err);
    }
});
