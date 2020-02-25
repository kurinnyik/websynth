const container = document.getElementsByClassName('container')[0];
const buttons = Array.from(document.getElementsByClassName('button'));
const noteCountText = document.getElementById('notecount');

const audioContext = new (window.AudioContext || window.webkitAudioContext);
const oscList = [];
let masterGainNode = null;
masterGainNode = audioContext.createGain();
masterGainNode.connect(audioContext.destination);
masterGainNode.gain.value = 0.2;
let osc = null;
let oscs = {};
const waveTypes = ['sine', 'square', 'sawtooth', 'triangle' ];
let waveType = 'sine';
let isDelayOn = false;
let delayNode;
function DelayToggle (e) {
  console.log('enter');

  if (e.keyCode === 13)  {
    isDelayOn = !isDelayOn;
    if (isDelayOn) {
      delayNode = audioContext.createDelay(1);
    } else {

    }
  }
};

document.body.addEventListener('onkeypress', () => {console.log('ahuet`')});

function changeWavetype (type) {
  waveType = type;
}

navigator.requestMIDIAccess()
  .then(onMIDISuccess, () => console.log('Could not access your MIDI devices.'));

function onMIDISuccess(midiAccess) {
  for (let input of midiAccess.inputs.values())
    input.onmidimessage = getMIDIMessage;

}

noteOn = (note, velocity) => {
  if (osc) {
    osc.stop();
    osc = null;
  }
  if (oscs[note]) {return}
  let newOsc = audioContext.createOscillator();
  newOsc.type = waveType;
  oscs[note] = newOsc;
  newOsc.connect(masterGainNode);
  let value = 10*(note-48);
  noteCountText.innerHTML = `${note}/${value}`;

  newOsc.frequency.value = parseFloat(50+value);
  masterGainNode.gain.value = velocity / 150;
  newOsc.start(0);
};
noteOff = (note) => {
  if (oscs[note]) {
    oscs[note].stop();
    delete oscs[note];
  };
 // masterGainNode.gain.value = 0;
};

const notesPlayed = {};
function getMIDIMessage(midiMessage) {
  var command = midiMessage.data[0];
  var note = midiMessage.data[1];
  var velocity = (midiMessage.data.length > 2) ? midiMessage.data[2] : 0; // a velocity value might not be included with a noteOff command

  switch (command) {
    case 144: // noteOn
      if (velocity > 0) {
        notesPlayed[note] = true;
        noteOn(note, velocity);
      } else {
        noteOff(note);
      }
      break;
    case 128: // noteOff
      noteOff(note);
      break;
  }
}


function playFreq (i) {
  return function () {
    console.log('start');
    console.log(oscList[i]);

    oscList[i] = audioContext.createOscillator();
    oscList[i].connect(masterGainNode);
    oscList[i].frequency.value = parseFloat(220 + 220 * i);
    oscList[i].start(0);

  }
};
function stopOsc (i) {

  return function () {
    console.log('stop');

    oscList[i].stop(0);
  }
};
buttons.forEach(function (b, i) {
  b.addEventListener('mousedown', playFreq(i));
  b.addEventListener("mouseup",stopOsc(i));
});
