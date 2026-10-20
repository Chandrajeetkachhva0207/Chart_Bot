// ============================================================================
// DARK 33-YEAR CYCLE TIMELINE ENGINE ("WHEN" VIEW)
// 1953 -> 1986 -> 2019 -> 2052
// ============================================================================

class DarkTimelineEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.slider = document.getElementById('timeline-scrubber');
        this.yearDisplay = document.getElementById('timeline-year-display');
        this.eventsTrack = document.getElementById('timeline-events-track');
        this.activeYear = 2019;

        this.init();
    }

    init() {
        if (!this.slider || !this.eventsTrack) return;
        this.renderEvents();
        this.setupEvents();
        this.updateToYear(2019);
    }

    setupEvents() {
        this.slider.addEventListener('input', (e) => {
            const year = parseInt(e.target.value, 10);
            this.updateToYear(year);
            window.darkAudio.playGeiger();
        });

        this.slider.addEventListener('change', (e) => {
            const year = parseInt(e.target.value, 10);
            window.darkAudio.playCycleChime(440 + (year - 1953) * 2);
        });
    }

    updateToYear(year) {
        this.activeYear = year;
        if (this.yearDisplay) {
            this.yearDisplay.textContent = year;
        }

        // Highlight active event cards
        const cards = this.eventsTrack.querySelectorAll('.timeline-event-card');
        cards.forEach(card => {
            const cardYear = parseInt(card.getAttribute('data-year'), 10);
            if (cardYear <= year) {
                card.classList.add('revealed');
                if (Math.abs(cardYear - year) < 10) {
                    card.classList.add('focused');
                } else {
                    card.classList.remove('focused');
                }
            } else {
                card.classList.remove('revealed', 'focused');
            }
        });
    }

    renderEvents() {
        this.eventsTrack.innerHTML = '';
        window.DARK_DATA.timelineEvents.forEach(evt => {
            const card = document.createElement('div');
            card.className = 'timeline-event-card';
            card.setAttribute('data-year', evt.year);
            card.innerHTML = `
                <div class="card-year-stamp">
                    <span class="year-num">${evt.year}</span>
                    <span class="cycle-tag">${evt.cycle}</span>
                </div>
                <div class="card-body">
                    <h4 class="card-title">${evt.title}</h4>
                    <p class="card-desc">${evt.description}</p>
                    <div class="card-anomaly">
                        <span class="anomaly-label">☢ DETECTED ANOMALY:</span>
                        <span class="anomaly-desc">${evt.anomaly}</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                window.darkAudio.playClick();
                this.slider.value = evt.year;
                this.updateToYear(evt.year);
            });

            this.eventsTrack.appendChild(card);
        });
    }
}

window.DarkTimelineEngine = DarkTimelineEngine;
