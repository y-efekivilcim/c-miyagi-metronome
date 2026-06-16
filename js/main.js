import { AudioEngine } from './AudioEngine.js';
import { CalmWave, Mark } from './Visualizer.js';

class MiyagiMetronome {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.bpmNumber = document.getElementById('bpm-number');
        this.bpmSlider = document.getElementById('bpm-slider');
        this.instruction = document.getElementById('instruction');
        this.notification = document.getElementById('notification');
        this.resetBtn = document.getElementById('reset-btn');

        this.audioEngine = new AudioEngine();
        this.wave = new CalmWave();
        
        this.bpm = 60;
        this.marks = [];
        this.MAX_MARKS = 100;
        this.MAX_ANGLE = Math.PI / 4.5;
        this.pivot = { x: 0, y: 0 };
        this.visualPendulumLength = 0;
        this.lastTime = performance.now();

        this.bindEvents();
        this.resize();
        this.draw();
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('pointerdown', (e) => this.handleInteraction(e));
        
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault(); 
                this.handleInteraction({ target: this.canvas }); 
            }
        });

        this.bpmSlider.addEventListener('input', (e) => {
            this.bpm = parseInt(e.target.value);
            this.bpmNumber.innerText = this.bpm;
            this.updatePendulumLength();
            
            this.audioEngine.setBpm(this.bpm);
            if (this.audioEngine.isRunning) {
                this.marks = [];
                this.notification.style.opacity = '0';
            }
        });

        this.resetBtn.addEventListener('click', () => {
            this.marks = [];
            this.notification.style.opacity = '0';
            this.wave.setWaveColor('#2c1a12');
            this.audioEngine.reset();
        });
    }

    resize() {
        this.canvas.width = window.innerWidth * window.devicePixelRatio;
        this.canvas.height = window.innerHeight * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        this.pivot.x = window.innerWidth / 2;
        this.pivot.y = window.innerHeight * 0.72;

        this.updatePendulumLength();
    }

    updatePendulumLength() {
        const minBpm = 24;
        const maxBpm = 240;
        
        const minH = window.innerHeight * 0.25;
        const maxH = window.innerHeight * 0.55; 
        
        const ratio = 1 - ((this.bpm - minBpm) / (maxBpm - minBpm));
        const clampedRatio = Math.max(0, Math.min(1, ratio));
        
        this.visualPendulumLength = minH + clampedRatio * (maxH - minH);
    }

    handleInteraction(e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON')) return;

        if (!this.audioEngine.isRunning) {
            this.audioEngine.start(this.bpm);
            this.instruction.style.opacity = '0';
            return;
        }

        if (this.marks.length >= this.MAX_MARKS) {
            this.instruction.style.display = 'none';
            this.notification.style.opacity = '1';
            return;
        }

        const tapTime = this.audioEngine.getCurrentTime();
        const perceivedTapTime = tapTime - 0.025; 
        
        const exactBeatsElapsed = (perceivedTapTime - this.audioEngine.firstBeatTime) / (60.0 / this.bpm);
        const exactAngleAtTap = this.MAX_ANGLE * Math.sin(exactBeatsElapsed * Math.PI);

        const mark = new Mark(exactAngleAtTap, this.MAX_ANGLE);
        this.marks.push(mark);

        let normalizedPos = (exactAngleAtTap / this.MAX_ANGLE + 1) / 2; 
        let splashX = normalizedPos * window.innerWidth;
        this.wave.addRipple(splashX, -50);
        this.wave.setWaveColor(mark.color); 
    }

    draw() {
        requestAnimationFrame(() => this.draw());
        
        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        const logicalWidth = window.innerWidth;
        const logicalHeight = window.innerHeight;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.beginPath();
        this.ctx.moveTo(this.pivot.x, this.pivot.y);
        this.ctx.lineTo(this.pivot.x, this.pivot.y - this.visualPendulumLength - 30);
        this.ctx.strokeStyle = 'rgba(44, 26, 18, 0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(this.pivot.x, this.pivot.y, this.visualPendulumLength, -Math.PI/2 - this.MAX_ANGLE, -Math.PI/2 + this.MAX_ANGLE);
        this.ctx.strokeStyle = 'rgba(44, 26, 18, 0.03)';
        this.ctx.stroke();

        this.marks.forEach(mark => mark.draw(this.ctx, this.pivot.x, this.pivot.y, this.visualPendulumLength));

        let currentAngle = 0;
        if (this.audioEngine.isRunning && this.audioEngine.audioCtx) {
            const timeElapsed = this.audioEngine.getCurrentTime() - this.audioEngine.firstBeatTime;
            const beatsElapsed = timeElapsed / (60.0 / this.bpm);
            currentAngle = this.MAX_ANGLE * Math.sin(beatsElapsed * Math.PI);
        }

        const currentX = this.pivot.x + Math.sin(currentAngle) * this.visualPendulumLength;
        const currentY = this.pivot.y - Math.cos(currentAngle) * this.visualPendulumLength;

        this.ctx.beginPath();
        this.ctx.moveTo(this.pivot.x, this.pivot.y);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.strokeStyle = 'rgba(44, 26, 18, 0.6)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(currentX, currentY, 7, 0, Math.PI * 2);
        this.ctx.fillStyle = '#2c1a12'; 
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(currentX - 2, currentY - 2, 2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fill();

        this.wave.update(dt);
        this.wave.draw(this.ctx, logicalWidth, logicalHeight);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new MiyagiMetronome();
});
