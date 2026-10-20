// ============================================================================
// DARK QUANTUM CHART ENGINE (Canvas Candlesticks + Paradox Indicators)
// Aesthetic: Obsidian, Golden Amber, Cyan, Crimson Anomaly Highlights
// ============================================================================

class DarkChartEngine {
    constructor(canvasId, containerId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById(containerId);

        this.currentSymbol = "btc";
        this.timeframe = "1D";
        this.candles = [];
        this.predictionCandles = [];
        this.hoverIndex = -1;
        this.mouseX = 0;
        this.mouseY = 0;

        // Toggleable layers
        this.showCausalBands = true;
        this.showPredictionCone = true;
        this.showAnomalies = true;
        this.showOscillator = true;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.generateData(this.currentSymbol);
        this.setupEvents();
        this.render();
    }

    resize() {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = rect.width;
        this.height = rect.height;
        this.render();
    }

    setSymbol(symbolKey) {
        this.currentSymbol = symbolKey;
        this.generateData(symbolKey);
        this.render();
    }

    setTimeframe(tf) {
        this.timeframe = tf;
        this.generateData(this.currentSymbol);
        this.render();
    }

    generateData(symbolKey) {
        const preset = window.DARK_DATA.chartPresets[symbolKey] || window.DARK_DATA.chartPresets["btc"];
        const count = 55;
        this.candles = [];
        let price = preset.basePrice * 0.88;
        const volatility = preset.volatility;

        const now = Date.now();
        const tfMs = this.timeframe === '15m' ? 15*60*1000 : (this.timeframe === '1H' ? 60*60*1000 : (this.timeframe === '33Y' ? 33*365*24*3600*1000 : 24*3600*1000));

        for (let i = 0; i < count; i++) {
            const time = now - (count - i) * tfMs;
            const delta = (Math.random() - 0.47) * volatility;
            const open = price;
            const close = open + delta;
            const high = Math.max(open, close) + Math.random() * (volatility * 0.6);
            const low = Math.min(open, close) - Math.random() * (volatility * 0.6);
            const volume = Math.floor(Math.random() * 50000 + 10000);

            // Anomaly flag on select cycles (e.g., indices with 33 resonance)
            const isAnomaly = (i === 14 || i === 33 || i === 47);

            this.candles.push({
                time,
                open,
                high,
                low,
                close,
                volume,
                isAnomaly,
                anomalyText: isAnomaly ? (i === 33 ? "33-YR PARADOX FLASH" : "CAUSAL LEAKAGE") : null
            });

            price = close;
        }

        // Generate Quantum AI Prediction Cone (Future projection for Cycle 2052)
        this.predictionCandles = [];
        let predPrice = price;
        for (let j = 0; j < 18; j++) {
            const time = now + (j + 1) * tfMs;
            const upwardBias = 0.58; // Bullish singularity trajectory
            const delta = (Math.random() - (1 - upwardBias)) * volatility * 1.3;
            const open = predPrice;
            const close = open + delta;
            const spread = (j + 1) * (volatility * 0.4); // expanding uncertainty cone
            const high = Math.max(open, close) + spread;
            const low = Math.min(open, close) - spread * 0.7;

            this.predictionCandles.push({
                time,
                open,
                high,
                low,
                close,
                upperBand: high + spread * 0.5,
                lowerBand: low - spread * 0.5
            });

            predPrice = close;
        }
    }

    setupEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this.updateHoverIndex();
            this.render();
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoverIndex = -1;
            this.render();
        });
    }

    updateHoverIndex() {
        const chartAreaWidth = this.width - 70;
        const totalBars = this.candles.length + (this.showPredictionCone ? this.predictionCandles.length : 0);
        const candleWidth = chartAreaWidth / totalBars;
        const idx = Math.floor(this.mouseX / candleWidth);

        if (idx >= 0 && idx < this.candles.length) {
            this.hoverIndex = idx;
        } else {
            this.hoverIndex = -1;
        }
    }

    render() {
        if (!this.ctx || !this.width) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Dimensions
        const rightGutter = 70;
        const chartWidth = this.width - rightGutter;
        const oscHeight = this.showOscillator ? 95 : 0;
        const mainHeight = this.height - oscHeight - 35;
        const totalBars = this.candles.length + (this.showPredictionCone ? this.predictionCandles.length : 0);
        const candleWidth = chartWidth / totalBars;

        // Min/Max bounds across candles and prediction
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        for (const c of this.candles) {
            if (c.low < minPrice) minPrice = c.low;
            if (c.high > maxPrice) maxPrice = c.high;
        }
        if (this.showPredictionCone) {
            for (const p of this.predictionCandles) {
                if (p.lowerBand < minPrice) minPrice = p.lowerBand;
                if (p.upperBand > maxPrice) maxPrice = p.upperBand;
            }
        }
        const padding = (maxPrice - minPrice) * 0.08 || 10;
        minPrice -= padding;
        maxPrice += padding;

        const getY = (val) => mainHeight - ((val - minPrice) / (maxPrice - minPrice)) * (mainHeight - 30) - 20;

        // 1. Draw Background Grid & Subtle Crosshatching
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        const gridSteps = 5;
        for (let g = 0; g <= gridSteps; g++) {
            const gy = 20 + (mainHeight - 40) * (g / gridSteps);
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(chartWidth, gy);
            ctx.stroke();

            // Price Labels on right gutter
            const priceAtG = maxPrice - (g / gridSteps) * (maxPrice - minPrice);
            ctx.fillStyle = 'rgba(212, 163, 89, 0.7)';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(priceAtG.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }), chartWidth + 8, gy + 3);
        }

        // 2. Draw Quantum Prediction Cone (Cycle 2052 Paradox Horizon)
        if (this.showPredictionCone && this.predictionCandles.length > 0) {
            const startX = this.candles.length * candleWidth;

            // Gradient Cone Shading
            ctx.beginPath();
            ctx.moveTo(startX, getY(this.candles[this.candles.length - 1].close));

            // Upper boundary curve
            for (let i = 0; i < this.predictionCandles.length; i++) {
                const px = startX + (i + 0.5) * candleWidth;
                const py = getY(this.predictionCandles[i].upperBand);
                ctx.lineTo(px, py);
            }
            // Lower boundary back to start
            for (let i = this.predictionCandles.length - 1; i >= 0; i--) {
                const px = startX + (i + 0.5) * candleWidth;
                const py = getY(this.predictionCandles[i].lowerBand);
                ctx.lineTo(px, py);
            }
            ctx.closePath();

            const coneGrad = ctx.createLinearGradient(startX, 0, this.width, 0);
            coneGrad.addColorStop(0, 'rgba(45, 226, 230, 0.22)');
            coneGrad.addColorStop(1, 'rgba(255, 59, 48, 0.12)');
            ctx.fillStyle = coneGrad;
            ctx.fill();

            // Prediction Horizon Dotted Line
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = '#2de2e6';
            ctx.lineWidth = 1.2;
            ctx.moveTo(startX, 0);
            ctx.lineTo(startX, mainHeight);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label on Horizon
            ctx.fillStyle = '#2de2e6';
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.fillText('⚡ 2052 PARADOX HORIZON', startX + 6, 25);
        }

        // 3. Draw Tannhaus Causal Bands (Smooth Moving Envelopes)
        if (this.showCausalBands && this.candles.length > 10) {
            const period = 14;
            const ma = [];
            for (let i = 0; i < this.candles.length; i++) {
                if (i < period) {
                    ma.push(this.candles[i].close);
                } else {
                    let sum = 0;
                    for (let k = 0; k < period; k++) sum += this.candles[i - k].close;
                    ma.push(sum / period);
                }
            }

            // Upper band & Lower band
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(229, 169, 59, 0.6)';
            ctx.lineWidth = 1.4;
            for (let i = 0; i < this.candles.length; i++) {
                const x = (i + 0.5) * candleWidth;
                const y = getY(ma[i] * 1.035);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(229, 169, 59, 0.35)';
            for (let i = 0; i < this.candles.length; i++) {
                const x = (i + 0.5) * candleWidth;
                const y = getY(ma[i] * 0.965);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // 4. Draw Candlesticks & Volume Bars
        const maxVol = Math.max(...this.candles.map(c => c.volume));
        const volBaseY = mainHeight;
        const volMaxH = 50;

        for (let i = 0; i < this.candles.length; i++) {
            const c = this.candles[i];
            const x = (i + 0.5) * candleWidth;
            const isBull = c.close >= c.open;
            const bodyColor = isBull ? '#38ef7d' : '#ff4b4b';
            const candleBarW = Math.max(candleWidth * 0.65, 2);

            // Volume bar at base
            const vh = (c.volume / maxVol) * volMaxH;
            ctx.fillStyle = isBull ? 'rgba(56, 239, 125, 0.15)' : 'rgba(255, 75, 75, 0.15)';
            ctx.fillRect(x - candleBarW / 2, volBaseY - vh, candleBarW, vh);

            // Wick
            ctx.beginPath();
            ctx.strokeStyle = bodyColor;
            ctx.lineWidth = 1.2;
            ctx.moveTo(x, getY(c.high));
            ctx.lineTo(x, getY(c.low));
            ctx.stroke();

            // Body
            const topY = getY(Math.max(c.open, c.close));
            const bottomY = getY(Math.min(c.open, c.close));
            const bodyHeight = Math.max(bottomY - topY, 1.5);

            ctx.fillStyle = bodyColor;
            ctx.fillRect(x - candleBarW / 2, topY, candleBarW, bodyHeight);

            // 5. Anomaly Markers
            if (this.showAnomalies && c.isAnomaly) {
                ctx.save();
                ctx.translate(x, getY(c.high) - 14);
                // Glowing triangle alert
                ctx.fillStyle = '#e5a93b';
                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(-5, 4);
                ctx.lineTo(5, 4);
                ctx.closePath();
                ctx.shadowColor = '#e5a93b';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.restore();

                // Text tag
                ctx.fillStyle = '#e5a93b';
                ctx.font = 'bold 8px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('33-RES', x, getY(c.high) - 22);
            }
        }

        // 6. Draw Future Projected Candles inside Cone
        if (this.showPredictionCone) {
            const startIdx = this.candles.length;
            for (let j = 0; j < this.predictionCandles.length; j++) {
                const pc = this.predictionCandles[j];
                const x = (startIdx + j + 0.5) * candleWidth;
                const isBull = pc.close >= pc.open;
                const pColor = isBull ? 'rgba(45, 226, 230, 0.7)' : 'rgba(255, 59, 48, 0.7)';
                const pBarW = Math.max(candleWidth * 0.5, 2);

                ctx.strokeStyle = pColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, getY(pc.high));
                ctx.lineTo(x, getY(pc.low));
                ctx.stroke();

                const topY = getY(Math.max(pc.open, pc.close));
                const botY = getY(Math.min(pc.open, pc.close));
                ctx.fillStyle = pColor;
                ctx.fillRect(x - pBarW / 2, topY, pBarW, Math.max(botY - topY, 1.5));
            }
        }

        // 7. Draw Triquetra Oscillator Subpane (33-Harmonic RSI)
        if (this.showOscillator) {
            const oscTop = mainHeight + 15;
            const oscH = oscHeight - 20;

            // Subpane Background
            ctx.fillStyle = 'rgba(10, 11, 14, 0.8)';
            ctx.fillRect(0, oscTop, chartWidth, oscH);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.strokeRect(0, oscTop, chartWidth, oscH);

            // 33 and 67 Threshold lines
            const y33 = oscTop + oscH * (1 - 0.33);
            const y67 = oscTop + oscH * (1 - 0.67);

            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = 'rgba(255, 59, 48, 0.4)'; // Anomaly upper
            ctx.beginPath();
            ctx.moveTo(0, y67);
            ctx.lineTo(chartWidth, y67);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(45, 226, 230, 0.4)'; // Anomaly lower
            ctx.beginPath();
            ctx.moveTo(0, y33);
            ctx.lineTo(chartWidth, y33);
            ctx.stroke();
            ctx.setLineDash([]);

            // Labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText('TRIQUETRA 33-OSCILLATOR', 8, oscTop + 12);
            ctx.fillText('67.0', chartWidth + 6, y67 + 3);
            ctx.fillText('33.0', chartWidth + 6, y33 + 3);

            // Sine-Wave / Momentum line
            ctx.beginPath();
            ctx.strokeStyle = '#e5a93b';
            ctx.lineWidth = 1.8;
            for (let i = 0; i < this.candles.length; i++) {
                const x = (i + 0.5) * candleWidth;
                // Harmonic oscillator calculation
                const oscVal = 50 + Math.sin(i * 0.28) * 22 + Math.cos(i * 0.12) * 12;
                const y = oscTop + oscH * (1 - (oscVal / 100));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // 8. Interactive Crosshair & Tooltip Readout
        if (this.hoverIndex >= 0 && this.hoverIndex < this.candles.length) {
            const hCandle = this.candles[this.hoverIndex];
            const hx = (this.hoverIndex + 0.5) * candleWidth;
            const hy = getY(hCandle.close);

            // Crosshair lines
            ctx.strokeStyle = 'rgba(229, 169, 59, 0.5)';
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(hx, 0);
            ctx.lineTo(hx, this.height);
            ctx.moveTo(0, hy);
            ctx.lineTo(chartWidth, hy);
            ctx.stroke();
            ctx.setLineDash([]);

            // Dot on close
            ctx.beginPath();
            ctx.arc(hx, hy, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Header OHLC Readout
            const dateStr = new Date(hCandle.time).toISOString().split('T')[0];
            ctx.fillStyle = '#f0e6d2';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            const ohlcText = `[DATE: ${dateStr}]  O: ${hCandle.open.toFixed(2)}  H: ${hCandle.high.toFixed(2)}  L: ${hCandle.low.toFixed(2)}  C: ${hCandle.close.toFixed(2)}  VOL: ${hCandle.volume.toLocaleString()}`;
            ctx.fillText(ohlcText, 10, 16);
        }
    }
}

window.DarkChartEngine = DarkChartEngine;
