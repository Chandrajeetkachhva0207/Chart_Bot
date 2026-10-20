// ============================================================================
// DARK CAUSAL NETWORK GRAPH (Interactive Canvas)
// Same-to-same visual layout as Netflix DARK Character/Relation Web
// ============================================================================

class DarkNetworkGraph {
    constructor(canvasId, containerId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById(containerId);

        this.nodes = [];
        this.links = [];
        this.selectedNode = null;
        this.hoveredNode = null;

        // Viewport Pan / Zoom state
        this.transform = {
            x: 0,
            y: 0,
            scale: 1,
            isDragging: false,
            startX: 0,
            startY: 0
        };

        // Animation state
        this.particles = [];
        this.animFrame = null;
        this.activeCycle = "cycle-2"; // default Cycle 2 (2019)

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.loadData();
        this.setupEvents();
        this.createParticles();
        this.animate();
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = rect.width;
        this.height = rect.height;
    }

    loadData() {
        // Deep copy nodes from DARK_DATA
        this.nodes = window.DARK_DATA.nodes.map(n => ({
            ...n,
            // Calculate absolute x,y from normalized coordinates
            screenX: n.coordinates.x * this.width,
            screenY: n.coordinates.y * this.height,
            radius: 28,
            pulse: Math.random() * Math.PI * 2
        }));

        this.links = window.DARK_DATA.links.map(l => ({ ...l }));
    }

    setupEvents() {
        // Mouse Down for Pan
        this.canvas.addEventListener('mousedown', (e) => {
            const pos = this.getCanvasPos(e);
            const clickedNode = this.getNodeAt(pos.x, pos.y);

            if (clickedNode) {
                this.selectNode(clickedNode);
                window.darkAudio.playClick();
            } else {
                this.transform.isDragging = true;
                this.transform.startX = e.clientX - this.transform.x;
                this.transform.startY = e.clientY - this.transform.y;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.transform.isDragging) {
                this.transform.x = e.clientX - this.transform.startX;
                this.transform.y = e.clientY - this.transform.startY;
                return;
            }

            const rect = this.canvas.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                const pos = this.getCanvasPos(e);
                const node = this.getNodeAt(pos.x, pos.y);
                if (node !== this.hoveredNode) {
                    this.hoveredNode = node;
                    this.canvas.style.cursor = node ? 'pointer' : 'grab';
                    if (node) window.darkAudio.playGeiger();
                }
            } else {
                if (this.hoveredNode) {
                    this.hoveredNode = null;
                    this.canvas.style.cursor = 'default';
                }
            }
        });

        window.addEventListener('mouseup', () => {
            this.transform.isDragging = false;
        });

        // Wheel Zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
            const newScale = Math.min(Math.max(this.transform.scale * zoomFactor, 0.5), 2.5);

            // Zoom towards mouse pointer
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;
            this.transform.x = mouseX - (mouseX - this.transform.x) * (newScale / this.transform.scale);
            this.transform.y = mouseY - (mouseY - this.transform.y) * (newScale / this.transform.scale);
            this.transform.scale = newScale;
        }, { passive: false });

        // Touch support for mobile
        let touchStartDist = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const x = (touch.clientX - rect.left - this.transform.x) / this.transform.scale;
                const y = (touch.clientY - rect.top - this.transform.y) / this.transform.scale;
                const node = this.getNodeAt(x, y);
                if (node) {
                    this.selectNode(node);
                    window.darkAudio.playClick();
                } else {
                    this.transform.isDragging = true;
                    this.transform.startX = touch.clientX - this.transform.x;
                    this.transform.startY = touch.clientY - this.transform.y;
                }
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.transform.isDragging && e.touches.length === 1) {
                const touch = e.touches[0];
                this.transform.x = touch.clientX - this.transform.startX;
                this.transform.y = touch.clientY - this.transform.startY;
            }
        });

        this.canvas.addEventListener('touchend', () => {
            this.transform.isDragging = false;
        });
    }

    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.transform.x) / this.transform.scale,
            y: (e.clientY - rect.top - this.transform.y) / this.transform.scale
        };
    }

    getNodeAt(x, y) {
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const n = this.nodes[i];
            const dx = x - (n.coordinates.x * this.width);
            const dy = y - (n.coordinates.y * this.height);
            if (Math.sqrt(dx * dx + dy * dy) <= n.radius + 6) {
                return n;
            }
        }
        return null;
    }

    selectNode(node) {
        this.selectedNode = node;
        if (window.onNodeSelectedCallback) {
            window.onNodeSelectedCallback(node);
        }
    }

    resetView() {
        this.transform = { x: 0, y: 0, scale: 1, isDragging: false, startX: 0, startY: 0 };
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3 - 0.1,
                size: Math.random() * 2 + 0.8,
                alpha: Math.random() * 0.6 + 0.2
            });
        }
    }

    setCycle(cycleId) {
        this.activeCycle = cycleId;
    }

    animate() {
        this.render();
        this.animFrame = requestAnimationFrame(() => this.animate());
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        ctx.save();
        ctx.translate(this.transform.x, this.transform.y);
        ctx.scale(this.transform.scale, this.transform.scale);

        // 1. Draw Golden Dust Particles in Spacetime
        ctx.fillStyle = '#e5a93b';
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = this.width;
            if (p.x > this.width) p.x = 0;
            if (p.y < 0) p.y = this.height;
            if (p.y > this.height) p.y = 0;

            ctx.globalAlpha = p.alpha * 0.4;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // 2. Draw Causal Links (Spline Curves with Pulses)
        const time = performance.now() * 0.001;
        const currentCycleColor = this.getCycleColor();

        for (const link of this.links) {
            const srcNode = this.nodes.find(n => n.id === link.source);
            const tgtNode = this.nodes.find(n => n.id === link.target);
            if (!srcNode || !tgtNode) continue;

            const sx = srcNode.coordinates.x * this.width;
            const sy = srcNode.coordinates.y * this.height;
            const tx = tgtNode.coordinates.x * this.width;
            const ty = tgtNode.coordinates.y * this.height;

            const isHighlighted = (this.selectedNode && (this.selectedNode.id === srcNode.id || this.selectedNode.id === tgtNode.id)) ||
                                  (this.hoveredNode && (this.hoveredNode.id === srcNode.id || this.hoveredNode.id === tgtNode.id));

            // Curved Control Point (Möbius loop tension)
            const midX = (sx + tx) / 2;
            const midY = (sy + ty) / 2;
            const dx = tx - sx;
            const dy = ty - sy;
            const normalX = -dy * 0.15;
            const normalY = dx * 0.15;
            const cx = midX + normalX;
            const cy = midY + normalY;

            // Draw Base Spline Thread
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(cx, cy, tx, ty);

            if (isHighlighted) {
                ctx.strokeStyle = currentCycleColor;
                ctx.lineWidth = 2.4;
                ctx.shadowColor = currentCycleColor;
                ctx.shadowBlur = 12;
            } else {
                ctx.strokeStyle = 'rgba(212, 163, 89, 0.22)';
                ctx.lineWidth = 1.0;
                ctx.shadowBlur = 0;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw traveling energy packet along bezier
            const t = ((time * link.pulseSpeed) % 1);
            // Quadratic bezier point formula: (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
            const px = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * tx;
            const py = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ty;

            ctx.beginPath();
            ctx.arc(px, py, isHighlighted ? 3.5 : 2, 0, Math.PI * 2);
            ctx.fillStyle = isHighlighted ? '#ffffff' : currentCycleColor;
            ctx.shadowColor = currentCycleColor;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // 3. Draw Nodes (Circular Portraits / Badges with Rings)
        for (const node of this.nodes) {
            const x = node.coordinates.x * this.width;
            const y = node.coordinates.y * this.height;
            const isSelected = this.selectedNode && this.selectedNode.id === node.id;
            const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;
            const isConnected = this.selectedNode && (this.selectedNode.connections.includes(node.id) || this.selectedNode.id === node.id);

            node.pulse += 0.03;
            const pulseScale = Math.sin(node.pulse) * 2;

            // Outer Orbiting Rings (DARK aesthetic)
            ctx.save();
            ctx.translate(x, y);

            // Ring 1 - Dashed Clockwork Ring
            ctx.beginPath();
            ctx.arc(0, 0, node.radius + 8 + (isSelected ? pulseScale : 0), 0, Math.PI * 2);
            ctx.strokeStyle = isSelected ? currentCycleColor : (isHovered ? '#e5a93b' : 'rgba(255, 255, 255, 0.12)');
            ctx.lineWidth = isSelected ? 1.8 : 1.0;
            if (!isSelected) ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // If selected or hovered, show subtle radioactive glow aura
            if (isSelected || isHovered) {
                const grad = ctx.createRadialGradient(0, 0, node.radius * 0.5, 0, 0, node.radius * 2);
                grad.addColorStop(0, 'rgba(229, 169, 59, 0.3)');
                grad.addColorStop(1, 'rgba(229, 169, 59, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, node.radius * 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Inner Disc Background
            ctx.beginPath();
            ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
            ctx.fillStyle = isSelected ? '#1c150b' : '#0c0d12';
            ctx.fill();
            ctx.strokeStyle = isSelected ? '#ffffff' : (isConnected ? currentCycleColor : 'rgba(212, 163, 89, 0.4)');
            ctx.lineWidth = isSelected ? 2.5 : 1.5;
            ctx.stroke();

            // Node Symbol / Glyph in Center
            ctx.fillStyle = isSelected ? currentCycleColor : '#f0e6d2';
            ctx.font = 'bold 15px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.code, 0, -2);

            // Cluster Tiny Symbol
            const cluster = window.DARK_DATA.clusters.find(c => c.id === node.cluster);
            if (cluster) {
                ctx.fillStyle = 'rgba(229, 169, 59, 0.7)';
                ctx.font = '10px serif';
                ctx.fillText(cluster.symbol, 0, 14);
            }

            ctx.restore();

            // Label Below Node
            ctx.save();
            ctx.translate(x, y + node.radius + 18);
            ctx.textAlign = 'center';

            // Title
            ctx.font = 'bold 11px "Space Grotesk", sans-serif';
            ctx.fillStyle = isSelected ? '#ffffff' : '#d8d3c5';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = 4;
            ctx.fillText(node.name, 0, 0);

            // Price / Metric
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = node.change24h.startsWith('+') ? '#38ef7d' : '#ff4b4b';
            ctx.fillText(`${node.price} (${node.change24h})`, 0, 13);

            ctx.restore();
        }

        ctx.restore();
    }

    getCycleColor() {
        const cycle = window.DARK_DATA.cycles.find(c => c.id === this.activeCycle);
        return cycle ? cycle.color : '#e5a93b';
    }
}

window.DarkNetworkGraph = DarkNetworkGraph;
