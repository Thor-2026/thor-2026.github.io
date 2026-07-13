// ======================================
// THOR DISPLAY CMS
// Schedule Module
// ======================================

document.addEventListener('DOMContentLoaded', async () => {
    const containerId = 'scheduleDisplayView';
    let container = document.getElementById(containerId);

    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);
    }

    const styleBlock = document.createElement('style');
    styleBlock.innerHTML = `
        #scheduleDisplayView {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #000;
        }
        .kb-slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 1.5s ease-in-out;
            background-size: cover;
            background-position: center;
            transform: scale(1);
        }
        .kb-slide.active {
            opacity: 1;
            animation: kenBurnsAnimation var(--kb-duration, 6s) ease-in-out forwards;
        }
        @keyframes kenBurnsAnimation {
            0% { transform: scale(1); }
            100% { transform: scale(1.08); }
        }
    `;
    document.head.appendChild(styleBlock);

    try {
        // 1. Fetch Rotation Interval Value from settings column
        const { data: settingsData } = await supabase.from('settings').select('schedule_seconds').limit(1).single();
        const intervalMs = (settingsData && settingsData.schedule_seconds ? parseInt(settingsData.schedule_seconds, 10) : 5) * 1000;

        // 2. Query individual enabled slides directly
        const { data: activeSlides, error } = await supabase
            .from('schedule_slots')
            .select('url')
            .eq('enabled', true)
            .neq('url', '')
            .order('slot', { ascending: true });

        if (error || !activeSlides || activeSlides.length === 0) {
            container.innerHTML = '<div style="color:#555; display:flex; justify-content:center; align-items:center; height:100%;">No active schedules loaded.</div>';
            return;
        }

        container.innerHTML = activeSlides.map((slide, idx) => `
            <div class="kb-slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${slide.url}'); --kb-duration: ${intervalMs + 1500}ms;"></div>
        `).join('');

        if (activeSlides.length > 1) {
            let currentIndex = 0;
            const slidesElements = container.querySelectorAll('.kb-slide');

            setInterval(() => {
                slidesElements[currentIndex].classList.remove('active');
                currentIndex = (currentIndex + 1) % slidesElements.length;
                slidesElements[currentIndex].classList.add('active');
            }, intervalMs);
        }
    } catch (err) {
        console.error('Failed processing display scheduler sequence: ', err);
    }
});
