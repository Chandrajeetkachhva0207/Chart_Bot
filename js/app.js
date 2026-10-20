// ============================================================================
// DARK AI CHART BOT - MAIN APP CONTROLLER
// Coordinates Tabs (WHO / WHAT / WHEN), Cycle Switchers, Dossier, and Audio
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Engines
    const networkGraph = new DarkNetworkGraph('network-canvas', 'network-container');
    const chartEngine = new DarkChartEngine('chart-canvas', 'chart-canvas-container');
    const chatbotEngine = new DarkChatbotEngine('chat-drawer');
    const timelineEngine = new DarkTimelineEngine('timeline-view');

    window.networkGraph = networkGraph;
    window.chartEngine = chartEngine;
    window.chatbotEngine = chatbotEngine;
    window.timelineEngine = timelineEngine;

    // 2. Global State
    let currentTab = 'who';
    let currentCycle = 'cycle-2';

    // 3. Audio Toggle Setup
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (audioBtn) {
        audioBtn.addEventListener('click', () => {
            const isPlaying = window.darkAudio.toggleMute();
            audioBtn.classList.toggle('active', isPlaying);
            const statusLabel = audioBtn.querySelector('.audio-label');
            if (statusLabel) statusLabel.textContent = isPlaying ? 'SOUND: RESONATING' : 'SOUND: MUTED';
        });
    }

    // Unlock AudioContext on first user gesture anywhere
    const unlockAudio = () => {
        window.darkAudio.init();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    // 4. Tab Navigation (WHO / WHAT / WHEN / ORACLE)
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    const tabViews = {
        'who': document.getElementById('view-who'),
        'what': document.getElementById('view-what'),
        'when': document.getElementById('view-when')
    };

    window.switchTab = (tabId) => {
        currentTab = tabId;
        window.darkAudio.playClick();

        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });

        Object.keys(tabViews).forEach(id => {
            if (tabViews[id]) {
                tabViews[id].classList.toggle('active', id === tabId);
            }
        });

        if (tabId === 'who') {
            setTimeout(() => networkGraph.resize(), 50);
        } else if (tabId === 'what') {
            setTimeout(() => chartEngine.resize(), 50);
        }
    };

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            if (tabId) window.switchTab(tabId);
        });
    });

    // 5. Oracle Chat Drawer Toggle
    const oracleToggleBtn = document.getElementById('oracle-toggle-btn');
    const chatDrawer = document.getElementById('chat-drawer');
    const chatCloseBtn = document.getElementById('chat-close-btn');

    const toggleOracleDrawer = () => {
        window.darkAudio.playClick();
        chatDrawer.classList.toggle('open');
        oracleToggleBtn.classList.toggle('active');
    };

    if (oracleToggleBtn) oracleToggleBtn.addEventListener('click', toggleOracleDrawer);
    if (chatCloseBtn) chatCloseBtn.addEventListener('click', toggleOracleDrawer);

    // 6. Cycle / Season Switcher (1986 / 2019 / 2052 / Origin)
    const cycleSelector = document.getElementById('cycle-selector');
    const cycleBadge = document.getElementById('header-cycle-badge');
    const anomalyBadge = document.getElementById('header-anomaly-count');

    window.setAppCycle = (cycleId) => {
        currentCycle = cycleId;
        const cycleData = window.DARK_DATA.cycles.find(c => c.id === cycleId);
        if (!cycleData) return;

        // Visual theme adjustment
        document.body.setAttribute('data-cycle', cycleId);
        document.documentElement.style.setProperty('--accent-glow', cycleData.color);

        if (cycleSelector) cycleSelector.value = cycleId;
        if (cycleBadge) {
            cycleBadge.textContent = cycleData.name;
            cycleBadge.style.borderColor = cycleData.color;
            cycleBadge.style.color = cycleData.color;
        }
        if (anomalyBadge) {
            anomalyBadge.textContent = `${cycleData.anomalyCount} ANOMALIES ACTIVE`;
        }

        // Notify subsystems
        networkGraph.setCycle(cycleId);
        window.darkAudio.playCycleChime(cycleId === 'cycle-1' ? 330 : (cycleId === 'cycle-2' ? 440 : 550));
    };

    if (cycleSelector) {
        cycleSelector.addEventListener('change', (e) => {
            window.setAppCycle(e.target.value);
        });
    }

    // 7. Node Selection -> Dossier Modal Setup
    const dossierModal = document.getElementById('entity-dossier');
    const dossierCloseBtn = document.getElementById('dossier-close-btn');

    window.onNodeSelectedCallback = (node) => {
        populateDossier(node);
        dossierModal.classList.add('open');
    };

    if (dossierCloseBtn) {
        dossierCloseBtn.addEventListener('click', () => {
            window.darkAudio.playClick();
            dossierModal.classList.remove('open');
        });
    }

    const populateDossier = (node) => {
        document.getElementById('dossier-title').textContent = node.name;
        document.getElementById('dossier-symbol').textContent = `${node.code} // ORIGIN: ${node.originYear}`;
        document.getElementById('dossier-price').textContent = node.price;
        document.getElementById('dossier-change').textContent = node.change24h;
        document.getElementById('dossier-change').style.color = node.change24h.startsWith('+') ? '#38ef7d' : '#ff4b4b';

        document.getElementById('dossier-summary').textContent = node.summary;
        document.getElementById('dossier-risk').textContent = node.paradoxRisk;
        document.getElementById('dossier-resonance').textContent = node.cycleResonance;

        // Status across cycles
        document.getElementById('status-c1').textContent = node.status.cycle1;
        document.getElementById('status-c2').textContent = node.status.cycle2;
        document.getElementById('status-c3').textContent = node.status.cycle3;

        // Causal ties list
        const tiesContainer = document.getElementById('dossier-ties');
        tiesContainer.innerHTML = '';
        node.connections.forEach(targetId => {
            const targetNode = window.DARK_DATA.nodes.find(n => n.id === targetId);
            if (targetNode) {
                const tag = document.createElement('span');
                tag.className = 'dossier-tag';
                tag.textContent = `⚡ ${targetNode.name}`;
                tag.addEventListener('click', () => {
                    networkGraph.selectNode(targetNode);
                });
                tiesContainer.appendChild(tag);
            }
        });

        // Action Buttons inside dossier
        const loadChartBtn = document.getElementById('dossier-load-chart-btn');
        if (loadChartBtn) {
            loadChartBtn.onclick = () => {
                window.darkAudio.playClick();
                dossierModal.classList.remove('open');
                window.switchTab('what');
                chartEngine.setSymbol(node.id);
            };
        }

        const askOracleBtn = document.getElementById('dossier-ask-oracle-btn');
        if (askOracleBtn) {
            askOracleBtn.onclick = () => {
                window.darkAudio.playClick();
                dossierModal.classList.remove('open');
                if (!chatDrawer.classList.contains('open')) toggleOracleDrawer();
                chatbotEngine.handleUserSubmit(`Analyze causal loop for ${node.name} (${node.code})`);
            };
        }
    };

    // 8. WHAT View Chart Controls
    const assetSelect = document.getElementById('chart-asset-select');
    if (assetSelect) {
        assetSelect.addEventListener('change', (e) => {
            window.darkAudio.playClick();
            chartEngine.setSymbol(e.target.value);
        });
    }

    const tfButtons = document.querySelectorAll('.tf-btn');
    tfButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tfButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.darkAudio.playClick();
            chartEngine.setTimeframe(btn.getAttribute('data-tf'));
        });
    });

    const toggleCausal = document.getElementById('toggle-causal-bands');
    if (toggleCausal) {
        toggleCausal.addEventListener('change', (e) => {
            chartEngine.showCausalBands = e.target.checked;
            chartEngine.render();
        });
    }

    const togglePrediction = document.getElementById('toggle-prediction-cone');
    if (togglePrediction) {
        togglePrediction.addEventListener('change', (e) => {
            chartEngine.showPredictionCone = e.target.checked;
            chartEngine.render();
        });
    }

    const toggleOsc = document.getElementById('toggle-oscillator');
    if (toggleOsc) {
        toggleOsc.addEventListener('change', (e) => {
            chartEngine.showOscillator = e.target.checked;
            chartEngine.render();
        });
    }

    // 9. Search Bar in WHO view
    const searchInput = document.getElementById('network-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                networkGraph.hoveredNode = null;
                networkGraph.render();
                return;
            }
            const found = networkGraph.nodes.find(n => n.name.toLowerCase().includes(query) || n.code.toLowerCase().includes(query));
            if (found) {
                networkGraph.hoveredNode = found;
                networkGraph.render();
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.toLowerCase().trim();
                const found = networkGraph.nodes.find(n => n.name.toLowerCase().includes(query) || n.code.toLowerCase().includes(query));
                if (found) {
                    networkGraph.selectNode(found);
                }
            }
        });
    }

    const resetGraphBtn = document.getElementById('reset-graph-btn');
    if (resetGraphBtn) {
        resetGraphBtn.addEventListener('click', () => {
            window.darkAudio.playClick();
            networkGraph.resetView();
        });
    }

    // 10. Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === '1') window.setAppCycle('cycle-1');
        if (e.key === '2') window.setAppCycle('cycle-2');
        if (e.key === '3') window.setAppCycle('cycle-3');
        if (e.key === '0') window.setAppCycle('origin');

        if (e.key.toLowerCase() === 'w') window.switchTab('who');
        if (e.key.toLowerCase() === 'e') window.switchTab('what');
        if (e.key.toLowerCase() === 'r') window.switchTab('when');

        if (e.key.toLowerCase() === 'o') toggleOracleDrawer();
        if (e.key.toLowerCase() === 'm' && audioBtn) audioBtn.click();
        if (e.key === 'Escape' && dossierModal.classList.contains('open')) {
            dossierModal.classList.remove('open');
        }
    });

    // Initialize Default Cycle
    window.setAppCycle('cycle-2');
});
