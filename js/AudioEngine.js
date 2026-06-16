export class AudioEngine {
    constructor() {
        this.audioCtx = null;
        this.firstBeatTime = 0;
        this.currentBeatIndex = 0;
        this.nextNoteTime = 0;
        this.lookahead = 25.0; 
        this.scheduleAheadTime = 0.1; 
        this.timerID = null;
        this.bpm = 60;
        this.isRunning = false;
    }

    start(bpm) {
        this.bpm = bpm;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.firstBeatTime = this.audioCtx.currentTime + 0.1;
        this.currentBeatIndex = 0;
        this.nextNoteTime = this.firstBeatTime; 
        this.isRunning = true;
        this.scheduler();
    }

    stop() {
        this.isRunning = false;
        if (this.timerID !== null) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
    }

    setBpm(bpm) {
        this.bpm = bpm;
        if (this.isRunning && this.audioCtx) {
            this.firstBeatTime = this.audioCtx.currentTime;
            this.currentBeatIndex = 0;
            this.nextNoteTime = this.firstBeatTime + (60.0 / this.bpm);
        }
    }

    reset() {
        if (this.isRunning && this.audioCtx) {
            this.firstBeatTime = this.audioCtx.currentTime;
            this.currentBeatIndex = 0;
            this.nextNoteTime = this.firstBeatTime + (60.0 / this.bpm);
        }
    }

    playTick(time) {
        if (!this.audioCtx) return;
        
        const baseFreq = 261.63; 

        const oscBody = this.audioCtx.createOscillator();
        const gainBody = this.audioCtx.createGain();
        oscBody.type = 'sine';
        oscBody.frequency.setValueAtTime(baseFreq, time);
        
        gainBody.gain.setValueAtTime(0, time);
        gainBody.gain.linearRampToValueAtTime(0.4, time + 0.02); 
        gainBody.gain.exponentialRampToValueAtTime(0.001, time + 0.4); 

        const oscStrike = this.audioCtx.createOscillator();
        const gainStrike = this.audioCtx.createGain();
        oscStrike.type = 'sine';
        oscStrike.frequency.setValueAtTime(baseFreq * 2.75, time); 
        
        gainStrike.gain.setValueAtTime(0, time);
        gainStrike.gain.linearRampToValueAtTime(0.08, time + 0.01); 
        gainStrike.gain.exponentialRampToValueAtTime(0.001, time + 0.1); 

        oscBody.connect(gainBody);
        gainBody.connect(this.audioCtx.destination);
        
        oscStrike.connect(gainStrike);
        gainStrike.connect(this.audioCtx.destination);

        oscBody.start(time);
        oscBody.stop(time + 0.5);
        
        oscStrike.start(time);
        oscStrike.stop(time + 0.15);
    }

    nextNote() {
        this.currentBeatIndex++;
        this.nextNoteTime = this.firstBeatTime + this.currentBeatIndex * (60.0 / this.bpm);
    }

    scheduler() {
        if (!this.isRunning) return;
        while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
            this.playTick(this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }

    getCurrentTime() {
        return this.audioCtx ? this.audioCtx.currentTime : 0;
    }
}
