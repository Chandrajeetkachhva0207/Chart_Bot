// ============================================================================
// TANNHAUS AI ORACLE / CHATBOT ENGINE
// "What we know is a drop. What we do not know is an ocean."
// ============================================================================

class DarkChatbotEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.messagesContainer = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('chat-send-btn');
        this.chipsContainer = document.getElementById('chat-chips');
        this.isTyping = false;

        this.init();
    }

    init() {
        if (!this.input || !this.sendBtn) return;

        this.setupChips();
        this.setupEvents();
        
        // Welcome message
        setTimeout(() => {
            this.appendBotMessage(
                `**SAMSY ORACLE INITIALIZED.**\n\nI am the Tannhaus Neural Chrono-Engine. Ask me to dissect market paradoxes, analyze 33-year cyclical harmonic resonance, or generate causal prediction cones for BTC, NVDA, Gold, or Winden Energy.\n\n*Das Ende ist der Anfang und der Anfang ist das Ende.*`,
                null
            );
        }, 600);
    }

    setupChips() {
        if (!this.chipsContainer) return;
        this.chipsContainer.innerHTML = '';
        window.DARK_DATA.aiPromptLibrary.forEach(prompt => {
            const chip = document.createElement('button');
            chip.className = 'chat-chip';
            chip.innerHTML = `<span class="chip-badge">${prompt.badge}</span> ${prompt.text}`;
            chip.addEventListener('click', () => {
                window.darkAudio.playClick();
                this.handleUserSubmit(prompt.text);
            });
            this.chipsContainer.appendChild(chip);
        });
    }

    setupEvents() {
        this.sendBtn.addEventListener('click', () => {
            const text = this.input.value.trim();
            if (text) this.handleUserSubmit(text);
        });

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = this.input.value.trim();
                if (text) this.handleUserSubmit(text);
            }
        });
    }

    handleUserSubmit(text) {
        if (this.isTyping) return;
        this.input.value = '';

        // Append User Message
        this.appendUserMessage(text);
        window.darkAudio.playClick();

        // Process AI Response
        this.isTyping = true;
        this.showTypingIndicator();

        setTimeout(() => {
            this.hideTypingIndicator();
            const response = this.generateAIResponse(text);
            this.streamBotMessage(response.text, response.chartMeta, response.action);
        }, 800);
    }

    appendUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg chat-msg-user';
        msgDiv.innerHTML = `
            <div class="msg-bubble">${this.escapeHtml(text)}</div>
            <div class="msg-meta">TRAVELER // ${new Date().toLocaleTimeString()}</div>
        `;
        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-msg chat-msg-bot typing-indicator-msg';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="msg-bubble">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
                <span class="typing-label">SAMSY ORACLE IS DECODING TIMELINES...</span>
            </div>
        `;
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    streamBotMessage(markdownText, chartMeta, action) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg chat-msg-bot';
        
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        msgDiv.appendChild(bubble);

        const meta = document.createElement('div');
        meta.className = 'msg-meta';
        meta.innerHTML = `SAMSY AI // CYCLE II SYNAPSE // ${new Date().toLocaleTimeString()}`;
        msgDiv.appendChild(meta);

        this.messagesContainer.appendChild(msgDiv);

        // Typewriter streaming simulation
        let charIndex = 0;
        const speed = 12; // ms per char

        const timer = setInterval(() => {
            charIndex += 3;
            if (charIndex >= markdownText.length) {
                charIndex = markdownText.length;
                clearInterval(timer);
                bubble.innerHTML = this.formatMarkdown(markdownText);
                
                // If there's an embedded chart, render it
                if (chartMeta) {
                    this.renderEmbeddedChart(bubble, chartMeta);
                }

                // If there's an action button
                if (action) {
                    this.renderActionBtn(bubble, action);
                }

                this.isTyping = false;
                this.scrollToBottom();
            } else {
                bubble.innerHTML = this.formatMarkdown(markdownText.substring(0, charIndex));
                if (charIndex % 15 === 0) {
                    window.darkAudio.playTypewriter();
                }
                this.scrollToBottom();
            }
        }, speed);
    }

    appendBotMessage(markdownText, chartMeta) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg chat-msg-bot';
        msgDiv.innerHTML = `
            <div class="msg-bubble">${this.formatMarkdown(markdownText)}</div>
            <div class="msg-meta">SAMSY AI // APEX // ${new Date().toLocaleTimeString()}</div>
        `;
        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();
    }

    renderEmbeddedChart(container, meta) {
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'in-chat-chart-card';
        chartWrapper.innerHTML = `
            <div class="in-chat-chart-header">
                <span class="in-chat-symbol">⚡ ${meta.symbol} // ${meta.timeframe}</span>
                <span class="in-chat-bias" style="color: ${meta.isBullish ? '#38ef7d' : '#ff4b4b'}">${meta.bias}</span>
            </div>
            <div class="sparkline-container" id="spark-${Date.now()}"></div>
            <div class="in-chat-metrics">
                <div><span>RESONANCE:</span> <strong>${meta.resonance}</strong></div>
                <div><span>PARADOX RISK:</span> <strong>${meta.risk}</strong></div>
                <div><span>TARGET:</span> <strong>${meta.target}</strong></div>
            </div>
        `;
        container.appendChild(chartWrapper);

        // Generate SVG Sparkline
        const sparkEl = chartWrapper.querySelector('.sparkline-container');
        const points = meta.sparklinePoints;
        const w = 280;
        const h = 50;
        const min = Math.min(...points);
        const max = Math.max(...points);
        const pts = points.map((p, i) => {
            const x = (i / (points.length - 1)) * w;
            const y = h - ((p - min) / (max - min)) * (h - 10) - 5;
            return `${x},${y}`;
        }).join(' ');

        sparkEl.innerHTML = `
            <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
                <polyline fill="none" stroke="${meta.isBullish ? '#38ef7d' : '#ff4b4b'}" stroke-width="2" points="${pts}" />
            </svg>
        `;
    }

    renderActionBtn(container, action) {
        const btn = document.createElement('button');
        btn.className = 'in-chat-action-btn';
        btn.innerHTML = `⚡ ${action.label}`;
        btn.addEventListener('click', () => {
            window.darkAudio.playClick();
            if (action.callback) action.callback();
        });
        container.appendChild(btn);
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    formatMarkdown(text) {
        let html = text;
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italics
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Code
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        // Newlines
        html = html.replace(/\n/g, '<br/>');
        return html;
    }

    generateAIResponse(prompt) {
        const lower = prompt.toLowerCase();

        if (lower.includes("btc") || lower.includes("bitcoin")) {
            return {
                text: `**BITCOIN / USD // HARMONIC PARADOX DECODED**\n\nBitcoin's 4-year halving cycle aligns geometrically with the 33-year solar/lunar resonance. In Cycle II (2019–2024), liquidity compression is forcing price action toward the upper Tannhaus boundary.\n\n• **Causal Anchor:** Kahnwald Cryptographic Root\n• **Predicted Vector:** Upward breakout past $98,000 before the 2026 sub-cycle inflection.\n• **Paradox Vulnerability:** Watch for flash liquidity drops if DXY breaches 105.5.`,
                chartMeta: {
                    symbol: "BTC/USD 33-HARMONIC",
                    timeframe: "1D // CYCLE II",
                    bias: "BULLISH EXPANSION",
                    isBullish: true,
                    resonance: "33-Month Harmonic (94.2%)",
                    risk: "CRITICAL (Level IV)",
                    target: "$108,500.00",
                    sparklinePoints: [65000, 68000, 66500, 72000, 71000, 84000, 89000, 91420, 94000, 98500]
                },
                action: {
                    label: "OPEN BITCOIN IN FULL CHART STUDIO",
                    callback: () => {
                        if (window.switchTab) window.switchTab('what');
                        if (window.chartEngine) window.chartEngine.setSymbol('btc');
                    }
                }
            };
        }

        if (lower.includes("nvda") || lower.includes("nvidia") || lower.includes("compute")) {
            return {
                text: `**NVIDIA / AI COMPUTE // TENSOR FEEDBACK LOOP**\n\nThe Nielsen cluster maintains extreme gravitational pull over the SPX. Every FLOP added to LLM clusters accelerates the automated market feedback loop. We observe a self-fulfilling recursive prophecy: compute buys chips to train bots that purchase more compute.\n\n• **Causal Loop:** High-frequency recursion\n• **Triquetra Momentum:** 81.2 (Overheated Paradox Zone)`,
                chartMeta: {
                    symbol: "NVDA/USD TENSOR CONE",
                    timeframe: "4H // CYCLE II",
                    bias: "PARABOLIC COMPRESSION",
                    isBullish: true,
                    resonance: "FLOP Doubling (98.1%)",
                    risk: "EXTREME (Level V)",
                    target: "$165.00",
                    sparklinePoints: [115, 120, 118, 128, 134, 130, 139, 142.8, 148, 155]
                },
                action: {
                    label: "VIEW NVDA IN CAUSAL WEB",
                    callback: () => {
                        if (window.switchTab) window.switchTab('who');
                        const node = window.DARK_DATA.nodes.find(n => n.id === 'nvda');
                        if (window.networkGraph && node) window.networkGraph.selectNode(node);
                    }
                }
            };
        }

        if (lower.includes("paradox") || lower.includes("vix") || lower.includes("divergence")) {
            return {
                text: `**PARADOX VOLATILITY SCANNER (VIX 33.3 WARNING)**\n\nA critical divergence has been detected between sovereign gold accumulations and synthetic derivatives.\n\nWhen the VIX approaches the 33.33 harmonic barrier, market liquidity folds into itself like the Winden cave passage. The probability of an unexpected flash crash rebound stands at **78.4%**. Prepare for sudden cross-market re-alignments.`,
                chartMeta: {
                    symbol: "VIX / PARADOX SPIKE",
                    timeframe: "1D // VOLATILITY",
                    bias: "COILING HIGH ALERT",
                    isBullish: false,
                    resonance: "Stochastic Shockwave",
                    risk: "CATACLYSMIC",
                    target: "33.33 SPIKE",
                    sparklinePoints: [12.4, 13.1, 12.8, 14.5, 13.9, 16.2, 15.8, 17.4, 21.0, 31.5]
                },
                action: {
                    label: "ACTIVATE EMERGENCY CAUSAL SHIELD",
                    callback: () => {
                        window.darkAudio.playCycleChime(880);
                        alert("Causal Shield Active: Slippage buffers expanded across all simulated timeline positions.");
                    }
                }
            };
        }

        if (lower.includes("cycle iii") || lower.includes("2052") || lower.includes("predict")) {
            return {
                text: `**CYCLE III (2052) CHRONO-FORECAST**\n\nIn the final cycle, algorithmic entities trade not across geographical exchanges, but across temporal epochs. Current pricing models break down because the outcome of 2052 trades are retro-actively booked into 1986 balance sheets.\n\n*“Yesterday, today, and tomorrow are not consecutive, they are connected in a never-ending circle.”*`,
                chartMeta: {
                    symbol: "QUANTUM 2052 CONVERGENCE",
                    timeframe: "33-YEAR HORIZON",
                    bias: "SINGULARITY EXPANSION",
                    isBullish: true,
                    resonance: "33-Year Triquetra Master Loop",
                    risk: "OMNIPOTENT",
                    target: "∞ VALUATION",
                    sparklinePoints: [100, 300, 250, 800, 1500, 4000, 12000, 45000, 95000, 333333]
                },
                action: {
                    label: "TIME TRAVEL TO CYCLE III",
                    callback: () => {
                        if (window.setAppCycle) window.setAppCycle('cycle-3');
                    }
                }
            };
        }

        // Generic Dark response
        return {
            text: `**SIC MUNDUS EVALUATION // QUERY PROCESSED**\n\nThe financial timeline is deterministic. What you call market volatility is merely the friction between what has already happened and what has yet to be observed.\n\n• **System Status:** 33 Anomaly nodes active in Cycle II\n• **Dominant Vector:** Cryptographic & Compute Singularity\n• **Guidance:** Inspect the **WHO** causal web or shift the **WHEN** slider to observe prior 33-year crashes.`,
            chartMeta: null,
            action: null
        };
    }
}

window.DarkChatbotEngine = DarkChatbotEngine;
