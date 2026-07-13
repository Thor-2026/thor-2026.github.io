// ======================================
// THOR DISPLAY CMS
// Schedule Module (Proportional Fit Cross-Fade)
// ======================================

let scheduleTimer = null;
let currentSlideIndex = 0;

async function loadSchedule() {
    // SECURITY GUARD: Stop execution if the presentation element is missing (e.g. inside Admin)
    const container = document.getElementById("scheduleImage");
    if (!container) return;

    if (typeof supabaseClient === 'undefined') return;

    try {
        // 1. Fetch Rotation Configuration Interval
        const { data: settingsData } = await supabaseClient.from('settings').select('schedule_seconds').limit(1).single();
        const intervalMs = (settingsData && settingsData.schedule_seconds ? parseInt(settingsData.schedule_seconds, 10) : 5) * 1000;

        // 2. Fetch Active Slots
        const { data: activeSlides, error } = await supabaseClient
            .from('schedule_slots')
            .select('url')
            .eq('enabled', true)
            .neq('url', '')
            .order('slot', { ascending: true });

        if (error || !activeSlides || activeSlides.length === 0) {
            container.parentNode.style.background = "transparent";
            container.style.display = "none";
            return;
        }

        // 3. Inject CSS for Pure Proportional Layout Matching
        if (!document.getElementById('fade-slideshow-core-styles')) {
            const styleBlock = document.createElement('style');
            styleBlock.id = 'fade-slideshow-core-styles';
            styleBlock.innerHTML = `
                .fade-wrapper-frame {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    background: transparent;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .fade-slide-layer {
                    position: absolute;
                    max-width: 100%;
                    max-height: 100%;
                    width: auto;
                    height: auto;
                    opacity: 0;
                    transition: opacity 1000ms ease-in-out;
                    object-fit: contain; /* Keeps original aspect ratio intact completely */
                }
                .fade-slide-layer.active {
                    opacity: 1;
                }
            `;
            document.head.appendChild(styleBlock);
        }

        // 4. Initialize Elements Layout Setup
        const parent = container.parentNode;
        let slideshowBox = document.getElementById('slideshowRenderContainer');
        
        if (!slideshowBox) {
            slideshowBox = document.createElement('div');
            slideshowBox.id = 'slideshowRenderContainer';
            slideshowBox.className = 'fade-wrapper-frame';
            slideshowBox.style.width = "100%";
            slideshowBox.style.height = "100%";
            parent.insertBefore(slideshowBox, container);
            container.style.display = "none"; 
        }

        // Generate slide <img> tags directly instead of background-images for strict constraint parsing
        const htmlContent = activeSlides.map((slide, idx) => `
            <img class="fade-slide-layer" src="${slide.url}?t=${Date.now()}" alt="Schedule Slot">
        `).join('');
        
        slideshowBox.innerHTML = htmlContent;

        // 5. Execute Slideshow Rotation Mechanics
        const layers = slideshowBox.querySelectorAll('.fade-slide-layer');
        if (layers.length > 0) {
            if (currentSlideIndex >= layers.length) currentSlideIndex = 0;
            layers[currentSlideIndex].classList.add('active');

            if (scheduleTimer) clearInterval(scheduleTimer);
            
            if (layers.length > 1) {
                scheduleTimer = setInterval(() => {
                    layers[currentSlideIndex].classList.remove('active');
                    currentSlideIndex = (currentSlideIndex + 1) % layers.length;
                    layers[currentSlideIndex].classList.add('active');
                }, intervalMs);
            }
        }

    } catch (err) {
        console.error("Schedule Presentation Engine Error:", err);
    }
}

function startSchedule() {
    loadSchedule();
    setInterval(loadSchedule, 60000);
}

function stopSchedule() {
    if (scheduleTimer) {
        clearInterval(scheduleTimer);
        scheduleTimer = null;
    }
}
