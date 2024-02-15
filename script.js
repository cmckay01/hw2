document.addEventListener("DOMContentLoaded", function(event) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const globalGain = audioCtx.createGain();
    globalGain.gain.setValueAtTime(0.5, audioCtx.currentTime); // Master volume to prevent clipping
    globalGain.connect(audioCtx.destination);

    let synthesisType = 'additive'; // Default synthesis type
    let waveformType = 'sine'; // Default waveform

    const keyboardFrequencyMap = {
        '90': 261.63,  // C4 - Z
        '88': 293.66,  // D4 - X
        '67': 329.63,  // E4 - C
        '86': 349.23,  // F4 - V
        '66': 392.00,  // G4 - B
        '78': 440.00,  // A4 - N
        '77': 493.88,  // B4 - M
        '81': 523.25,  // C5 - Q
    }

    let activeOscillators = {};

    document.getElementById('waveform').addEventListener('change', function(event) {
        waveformType = event.target.value;
    });

    document.getElementById('synthType').addEventListener('change', function(event) {
        synthesisType = event.target.value;
    });

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            switch (synthesisType) {
                case 'additive':
                    activeOscillators[key] = additiveSynthesis(keyboardFrequencyMap[key]);
                    break;
                case 'am':
                    activeOscillators[key] = amSynthesis(keyboardFrequencyMap[key]);
                    break;
                case 'fm':
                    activeOscillators[key] = fmSynthesis(keyboardFrequencyMap[key]);
                    break;
            }
        }
    }

    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            activeOscillators[key].forEach(osc => {
                osc.stop(audioCtx.currentTime);
                osc.disconnect();
            });
            delete activeOscillators[key];
        }
    }

    function additiveSynthesis(frequency) {
        const partials = [1, 2, 3];
        const partialGains = [0.5, 0.3, 0.2];
        const oscillators = [];
    
        partials.forEach((partial, index) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(frequency * partial, audioCtx.currentTime);
            gain.gain.setValueAtTime(partialGains[index], audioCtx.currentTime);
            osc.type = waveformType;
    
            // If the LFO target is amplitude modulation for each oscillator
            if (lfoTarget.value === 'amplitude') {
                const lfo = audioCtx.createOscillator();
                const lfoGain = audioCtx.createGain();
                // Example LFO settings; these could be dynamic based on UI controls
                lfo.frequency.setValueAtTime(5, audioCtx.currentTime); // LFO frequency for tremolo effect
                lfoGain.gain.setValueAtTime(0.5, audioCtx.currentTime); // Modulation depth
                lfo.connect(lfoGain);
                lfoGain.connect(gain.gain); // Connect LFO to modulate oscillator's gain
                lfo.start();
            }
    
            osc.connect(gain).connect(globalGain);
            osc.start();
            oscillators.push(osc);
        });
    
        return oscillators;
    }
    

    function amSynthesis(frequency) {
        const carrier = audioCtx.createOscillator();
        const modulator = audioCtx.createOscillator();
        const modulatorGain = audioCtx.createGain();
    
        carrier.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        modulator.frequency.setValueAtTime(10, audioCtx.currentTime); // Hardcoded modulation frequency
        modulatorGain.gain.setValueAtTime(1, audioCtx.currentTime); // Modulation depth
    
        modulator.connect(modulatorGain);
        modulatorGain.connect(carrier.frequency);
        carrier.connect(globalGain);
    
        carrier.start();
        modulator.start();
    
        return [carrier, modulator];
    }
    
    function fmSynthesis(frequency) {
        const carrier = audioCtx.createOscillator();
        const modulator = audioCtx.createOscillator();
        const modulatorGain = audioCtx.createGain();
    
        carrier.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        modulator.frequency.setValueAtTime(5, audioCtx.currentTime); // Hardcoded modulation frequency
        modulatorGain.gain.setValueAtTime(100, audioCtx.currentTime); // Modulation index
    
        modulator.connect(modulatorGain);
        modulatorGain.connect(carrier.frequency);
        carrier.connect(globalGain);
    
        carrier.start();
        modulator.start();
    
        return [carrier, modulator];
    }

    // LFO implementation
    function lfoToGain() {
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        const lfoFrequency = document.getElementById('lfoFrequency');
        const lfoDepth = document.getElementById('lfoDepth');
    
        lfo.frequency.setValueAtTime(parseFloat(lfoFrequency.value), audioCtx.currentTime);
        lfoGain.gain.setValueAtTime(parseFloat(lfoDepth.value), audioCtx.currentTime);
    
        lfo.connect(lfoGain);
        // Connect lfoGain to the desired parameter based on synthType and user selection
    
        lfo.start();
    }
    
    // Parameter control
    // Add event listeners for your control elements here (textboxes, sliders)
    // Update audio parameters in your synthesis functions using setValueAtTime()
    
    // Clipping prevention
    const clippingPreventionCheckbox = document.getElementById('clippingPrevention');
    function updateGlobalGain() {
        // ... your existing calculation logic
        if (clippingPreventionCheckbox.checked) {
        globalGain.gain.setValueAtTime(1 / Math.max(totalGain, 1), audioCtx.currentTime);
        }
    }

    // LFO target selection
    const lfoTarget = document.getElementById('lfoTarget');
    // Update connection points in your synthesis functions based on lfoTarget.value
    
    // ... your existing synthesisType switch statement
    
    // Call lfoToGain() based on synthesisType
    
    // Call updateGlobalGain() whenever oscillators start/stop or periodically
    
    // Other user experience enhancements:
    // - Implement sustain pedal support
    // -

    // Parameter control
   // Modulation frequency
    document.getElementById('modulationFrequency').addEventListener('change', function(event) {
        modFrequency = parseFloat(event.target.value);
        modulator.frequency.setValueAtTime(modFrequency, audioCtx.currentTime);
    });

    document.getElementById('partials').addEventListener('change', function(event) {
        partials = parseInt(event.target.value);
    });

    // Recording
    const mediaRecorder = new MediaRecorder(audioCtx.destination.stream);
    let chunks = [];

    mediaRecorder.ondataavailable = function(e) {
        chunks.push(e.data);
    }

    mediaRecorder.onstop = function(e) {
        const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
        chunks = [];
        const audioURL = window.URL.createObjectURL(blob);
        // You can now use audioURL for playback or for uploading to the server
    }
    

})